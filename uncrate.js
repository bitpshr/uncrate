#!/usr/bin/env node

const { dirname, join, relative } = require('path');
const { ensureDirSync, readFileSync, removeSync, writeFileSync } = require('fs-extra');
const markdown = require('markdown-it')().use(require('markdown-it-anchor'), {
	permalink: true,
	permalinkSymbol: '#'
});

const args = require('yargs')
	.option('d', { alias: 'description', desc: 'Generated site meta description' })
	.option('e', { alias: 'exclude', desc: 'RegExp of paths to ignore', default: 'node_modules' })
	.option('l', { alias: 'logo', desc: 'URL of a project logo image' })
	.option('n', { alias: 'name', desc: 'Project name' })
	.option('o', { alias: 'out', desc: 'Path where the site should be generated', default: 'dist' })
	.option('p', { alias: 'projectVersion', desc: 'Project version' })
	.option('r', { alias: 'repo', desc: 'URL of a project git repository' })
	.option('s', { alias: 'subdir', desc: 'Path to use as a base for generated URLs', default: '/' })
	.alias('h', 'help').argv;

removeSync(args.out);
const template = readFileSync(join(__dirname, 'template.html'), 'utf8');
const tree = require('directory-tree')(process.cwd(), {
	exclude: new RegExp(args.exclude),
	extensions: /\.md$/
});

const walk = children => {
	children
		.sort((a, b) => (a.name < b.name ? -1 : 1))
		.forEach(child => {
			if (child.type === 'directory') {
				return child.children && walk(child.children);
			}
			const copy = markdown.render(readFileSync(child.path, 'utf8'));
			const html = require('ejs').render(template, { args, copy, relative, tree });
			const path = relative(process.cwd(), child.path.replace(/[\/\\]\d+_/g, '/'));
			const file = join(process.cwd(), args.out, path).replace(/\.md$/, '.html');
			ensureDirSync(dirname(file));
			writeFileSync(file, html);
		});
};

walk(tree.children);
