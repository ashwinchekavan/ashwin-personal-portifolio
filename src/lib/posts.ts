import { readingTime } from '../config';
import { slugify } from '../slug';
import { query, type WriteResult } from './db';
import { cleanImageUrl, sanitizeContent, textOnly } from './sanitize';

export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  // An uploaded image path (/uploads/…) or an https link; null uses the default image.
  cover: string | null;
  content: string;
  published: boolean;
  date: Date;
  updated: Date;
  minutes: number;
}

interface Row {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  cover: string | null;
  content: string;
  published: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const toPost = (row: Row): Post => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  category: row.category,
  cover: row.cover,
  content: row.content,
  published: Boolean(row.published),
  date: row.published_at ?? row.created_at,
  updated: row.updated_at,
  minutes: readingTime(textOnly(row.content)),
});

const select = (where: string, params: unknown[] = []) => query<Row[]>(`SELECT * FROM posts ${where}`, params);

export async function listPublished(limit = 500) {
  return (await select('WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT ?', [limit])).map(toPost);
}

export async function countPublished() {
  const [row] = await query<{ total: number }[]>('SELECT COUNT(*) AS total FROM posts WHERE published = 1');
  return Number(row?.total ?? 0);
}

export async function listPublishedPage(limit: number, offset: number) {
  return (
    await select('WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?', [limit, offset])
  ).map(toPost);
}

// For public pages that should still render if the database is unreachable.
export async function listPublishedOrEmpty(limit?: number) {
  try {
    return await listPublished(limit);
  } catch (error) {
    console.error('Could not load posts:', error);
    return [];
  }
}

export async function getPublishedBySlug(slug: string) {
  const [row] = await select('WHERE published = 1 AND slug = ?', [slug]);
  return row ? toPost(row) : null;
}

export async function listAll() {
  return (await select('ORDER BY updated_at DESC, id DESC')).map(toPost);
}

export async function getById(id: number) {
  const [row] = await select('WHERE id = ?', [id]);
  return row ? toPost(row) : null;
}

export class InvalidPost extends Error {}

// Cleans what the editor sends: required title, safe HTML, fallback summary and category.
function normalise(input: Record<string, unknown>) {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const title = text(input.title).slice(0, 200);
  if (!title) throw new InvalidPost('Please give the post a title.');
  const content = sanitizeContent(text(input.content));
  const summary = text(input.description) || textOnly(content);
  return {
    title,
    content,
    description: summary.length > 200 ? `${summary.slice(0, 197).trimEnd()}…` : summary,
    category: text(input.category).slice(0, 60) || 'General',
    cover: cleanImageUrl(input.cover),
    published: input.published === true,
  };
}

async function uniqueSlug(title: string) {
  const base = slugify(title).slice(0, 80) || 'post';
  const rows = await query<{ slug: string }[]>('SELECT slug FROM posts WHERE slug = ? OR slug LIKE ?', [
    base,
    `${base}-%`,
  ]);
  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function createPost(input: Record<string, unknown>) {
  const post = normalise(input);
  const { insertId } = await query<WriteResult>(
    `INSERT INTO posts
       (slug, title, description, category, cover, content, published, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, IF(?, UTC_TIMESTAMP(), NULL), UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
    [
      await uniqueSlug(post.title),
      post.title,
      post.description,
      post.category,
      post.cover,
      post.content,
      post.published,
      post.published,
    ],
  );
  return (await getById(insertId))!;
}

// The slug (and so the public address) is kept when a post is edited.
export async function updatePost(id: number, input: Record<string, unknown>) {
  const post = normalise(input);
  await query<WriteResult>(
    `UPDATE posts
     SET title = ?, description = ?, category = ?, cover = ?, content = ?, published = ?,
         published_at = IF(? AND published_at IS NULL, UTC_TIMESTAMP(), published_at),
         updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [post.title, post.description, post.category, post.cover, post.content, post.published, post.published, id],
  );
  return getById(id);
}

export async function deletePost(id: number) {
  const { affectedRows } = await query<WriteResult>('DELETE FROM posts WHERE id = ?', [id]);
  return affectedRows > 0;
}
