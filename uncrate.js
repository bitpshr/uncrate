#!/usr/bin/env node

const { dirname, join, relative } = require('path');
const { emptyDirSync, ensureDirSync, readFileSync, writeFileSync } = require('fs-extra');
const markdown = require('markdown-it')().use(require('markdown-it-anchor'), {
	permalink: true,
	permalinkSymbol: '#'
});

const { description, exclude, logo, name, out, repo, projectVersion } = require('yargs')
	.option('d', { alias: 'description', desc: 'Generated site meta description' })
	.option('e', { alias: 'exclude', desc: 'RegExp of paths to ignore', default: 'node_modules' })
	.option('l', { alias: 'logo', desc: 'URL of a project logo image' })
	.option('n', { alias: 'name', desc: 'Project name' })
	.option('o', { alias: 'out', desc: 'Path where the site should be generated', default: 'dist' })
	.option('p', { alias: 'projectVersion', desc: 'Project version' })
	.option('r', { alias: 'repo', desc: 'URL of a project git repository' })
	.alias('h', 'help').argv;

const template = readFileSync(join(__dirname, 'template.html'), 'utf8');
const tree = require('directory-tree')(process.cwd(), {
	exclude: exclude && new RegExp(exclude),
	extensions: /\.md$/
});

const walk = children => {
	children.sort().forEach(child => {
		if (child.type === 'directory') {
			child.children && walk(child.children);
			return;
		}
		const html = require('ejs').render(template, {
			content: markdown.render(readFileSync(child.path, 'utf8')),
			cwd: process.cwd(),
			description,
			logo,
			name,
			projectVersion,
			relative,
			repo,
			tree
		});
		const newPath = join(process.cwd(), out, relative(process.cwd(), child.path)).replace(/\.md$/, '.html');
		ensureDirSync(dirname(newPath));
		writeFileSync(newPath, html);
	});
};

emptyDirSync(out);
walk(tree.children);
