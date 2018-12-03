#!/usr/bin/env node

const hrtime = process.hrtime();
const { dirname, join, relative } = require('path');
const { existsSync, ensureDirSync, readFileSync, writeFileSync } = require('fs-extra');
const { options } = require('yargs');
const markdown = require('markdown-it')({
	html: true,
	linkify: true,
	typographer: true
})
	.use(require('markdown-it-highlightjs'))
	.use(require('markdown-it-task-lists'))
	.use(require('markdown-it-anchor'), {
		permalink: true,
		permalinkSymbol: '#'
	});

const args = options({
	a: { alias: 'assets', desc: 'External resource URLs (JS or CSS)', type: 'array' },
	c: { alias: 'config', desc: 'Configuration file path', default: 'uncrate.config.js' },
	d: { alias: 'description', desc: 'Generated site meta description', type: 'string' },
	e: { alias: 'excludes', desc: 'RegExps used to ignore folders', type: 'array' },
	h: { alias: 'help' },
	l: { alias: 'logo', desc: 'URL of a project logo image', type: 'string' },
	n: { alias: 'name', desc: 'Project name', type: 'string' },
	o: { alias: 'out', desc: 'Path where the site should be generated', type: 'string' },
	p: { alias: 'projectVersion', desc: 'Project version', type: 'string' },
	r: { alias: 'repo', desc: 'URL of a project git repository', type: 'string' },
	s: { alias: 'root', desc: 'Path to use as a base for generated URLs', type: 'string' },
	t: { alias: 'theme', desc: 'Enable default styling', type: 'boolean' },
	v: { alias: 'version', desc: 'Show version information' }
}).argv;

const custom = join(process.cwd(), args.config);
const parsed = existsSync(custom) ? { ...require(custom), ...args } : args;
const config = { excludes: [], out: 'dist', subdir: '/', ...parsed };

const template = readFileSync(join(__dirname, 'template.html'), 'utf8');
const filetree = require('directory-tree')(process.cwd(), {
	exclude: config.excludes && config.excludes.map(exclude => new RegExp(exclude)),
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
			const html = require('ejs').render(template, { config, copy, filetree, relative });
			const path = relative(process.cwd(), child.path.replace(/[\/\\]\d+_/g, '/'));
			const file = join(process.cwd(), config.out, path).replace(/\.md$/, '.html');
			ensureDirSync(dirname(file));
			writeFileSync(file, html);
		});
})(filetree.children);
console.log(`🔥 Documentation generated in ${require('pretty-hrtime')(process.hrtime(hrtime))}`);
