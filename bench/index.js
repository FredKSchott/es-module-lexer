/*
 * Shimport benchmarks for comparison
 */

import fs from 'fs';
import c from 'kleur';

const n = 25;

const files = fs.readdirSync('test/samples')
	.map(f => `test/samples/${f}`)
	.filter(x => x.endsWith('.js'))
	.map(file => {
		const source = fs.readFileSync(file);
		return {
			file,
			code: source.toString(),
			size: source.byteLength
		};
	});

Promise.resolve().then(async () => {
	function timeRun (code) {
		const start = process.hrtime.bigint();
		const parsed = parse(code);
		const end = process.hrtime.bigint();
		return Math.round(Number(end - start) / 1e6);
	}

	console.log('Module load time');
	{
		const start = process.hrtime.bigint();
		var { init, parse } = await import('../dist/lexer.js');
		await init;
		console.log(`> ${c.bold.green(Math.round(Number(process.hrtime.bigint() - start) / 1e6) + 'ms')}`);
	}

	console.log('Cold Run, All Samples');
	let totalSize = 0;
	{
		let total = 0;
		files.forEach(({ code, size }) => {
			totalSize += size;
			total += timeRun(code);
		});
		console.log(c.bold.cyan(`test/samples/*.js (${Math.round(totalSize / 1e3)} KiB)`));
		console.log(`> ${c.bold.green(total + 'ms')}`);
		gc();
	}

	console.log(`\nWarm Runs (average of ${n} runs)`);
	files.forEach(({ file, code, size }) => {
		console.log(c.bold.cyan(`${file} (${Math.round(size / 1e3)} KiB)`));

		let total = 0;
		for (let i = 0; i < n; i++) {
			total += timeRun(code);
			gc();
		}

		console.log(`> ${c.bold.green((total / n) + 'ms')}`);
	});

	console.log(`\nWarm Runs, All Samples (average of ${n} runs)`);
	{
		let total = 0;
		for (let i = 0; i < n; i++) {
			files.forEach(({ code }) => {
				total += timeRun(code);
			});
		}
		console.log(c.bold.cyan(`test/samples/*.js (${Math.round(totalSize / 1e3)} KiB)`));
		console.log(`> ${c.bold.green((total / n) + 'ms')}`);
	}
});
