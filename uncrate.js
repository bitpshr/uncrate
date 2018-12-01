#!/usr/bin/env node

const { dirname, join, relative } = require('path');
const { existsSync, ensureDirSync, readFileSync, removeSync, writeFileSync } = require('fs-extra');
const { options } = require('yargs');
const markdown = require('markdown-it')().use(require('markdown-it-anchor'), {
	permalink: true,
	permalinkSymbol: '#'
});

const args = options({
	c: { alias: 'config', desc: 'Custom configuration file location', default: 'uncrate.config.js' },
	d: { alias: 'description', desc: 'Generated site meta description' },
	e: { alias: 'exclude', desc: 'RegExp of paths to ignore' },
	l: { alias: 'logo', desc: 'URL of a project logo image' },
	n: { alias: 'name', desc: 'Project name' },
	o: { alias: 'out', desc: 'Path where the site should be generated' },
	p: { alias: 'projectVersion', desc: 'Project version' },
	r: { alias: 'repo', desc: 'URL of a project git repository' },
	s: { alias: 'subdir', desc: 'Path to use as a base for generated URLs' }
}).alias('h', 'help').argv;

const custom = join(process.cwd(), args.config);
const parsed = existsSync(custom) ? { ...require(custom), ...args } : args;
const config = { out: 'dist', subdir: '/', ...parsed };

removeSync(config.out);
const template = readFileSync(join(__dirname, 'template.html'), 'utf8');
const tree = require('directory-tree')(process.cwd(), {
	exclude: config.exclude && new RegExp(config.exclude),
	extensions: /\.md$/
});

(function walk(children) {
	children
		.sort((a, b) => (a.name < b.name ? -1 : 1))
		.forEach(child => {
			if (child.type === 'directory') {
				return child.children && walk(child.children);
			}
			const copy = markdown.render(readFileSync(child.path, 'utf8'));
			const html = require('ejs').render(template, { config, copy, relative, tree });
			const path = relative(process.cwd(), child.path.replace(/[\/\\]\d+_/g, '/'));
			const file = join(process.cwd(), config.out, path).replace(/\.md$/, '.html');
			ensureDirSync(dirname(file));
			writeFileSync(file, html);
		});
})(tree.children);
