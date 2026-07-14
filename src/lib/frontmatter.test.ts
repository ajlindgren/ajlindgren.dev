import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from './frontmatter';

describe('parseFrontmatter', () => {
  it('splits leading --- frontmatter from the body', () => {
    const raw = ['---', 'title: A Book', 'year: 2021', '---', 'One honest page.', ''].join('\n');
    const { data, body } = parseFrontmatter(raw);
    expect(data.title).toBe('A Book');
    expect(data.year).toBe('2021');
    expect(body).toBe('One honest page.');
  });

  it('strips matching single or double quotes around values', () => {
    const raw = ['---', 'title: "Quoted Title"', "constraint: 'the wall'", '---', 'body'].join('\n');
    const { data } = parseFrontmatter(raw);
    expect(data.title).toBe('Quoted Title');
    expect(data.constraint).toBe('the wall');
  });

  it('keeps colons that appear inside the value', () => {
    const raw = ['---', 'title: Ratio: a study', '---', ''].join('\n');
    const { data } = parseFrontmatter(raw);
    expect(data.title).toBe('Ratio: a study');
  });

  it('returns empty data and the whole string as body when there is no frontmatter', () => {
    const raw = 'just a body with no frontmatter';
    const { data, body } = parseFrontmatter(raw);
    expect(data).toEqual({});
    expect(body).toBe('just a body with no frontmatter');
  });

  it('preserves blank-line-separated paragraphs in the body', () => {
    const raw = ['---', 'title: T', '---', 'Para one.', '', 'Para two.'].join('\n');
    const { body } = parseFrontmatter(raw);
    expect(body).toBe('Para one.\n\nPara two.');
  });

  it('tolerates CRLF line endings', () => {
    const raw = ['---', 'title: T', '---', 'body'].join('\r\n');
    const { data, body } = parseFrontmatter(raw);
    expect(data.title).toBe('T');
    expect(body).toBe('body');
  });

  it('ignores blank and malformed lines in the frontmatter block', () => {
    const raw = ['---', 'title: T', '', 'noColonHere', 'lesson: keep going', '---', 'b'].join('\n');
    const { data } = parseFrontmatter(raw);
    expect(data.title).toBe('T');
    expect(data.lesson).toBe('keep going');
    expect(Object.keys(data)).toHaveLength(2);
  });
});
