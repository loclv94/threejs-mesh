import simpleGit from 'simple-git';
import { exec } from 'child_process';

( async() => {

	const git = simpleGit();
	const status = await git.status();

	const modified = status.modified.length + status.created.length + status.renamed.length + status.deleted.length;
	if ( modified !== 0 ) {

		console.error( 'Current branch is not clean' );
		process.exit( 1 );

	}

	const currentBranch = status.current;

	console.log( 'Running Benchmark' );
	// await runScript( 'npm run build-silent' );
	await runScript( 'node ./benchmark/run-benchmark.js --long --json > pr-benchmark.json' );

	console.log( 'Running Master Benchmark' );
	await git.checkout( 'master' );
	// await runScript( 'npm run build-silent' );
	await runScript( 'node ./benchmark/run-benchmark.js --long --json > master-benchmark.json' );

	console.log( 'Comparing Benchmarks' );
	console.log();

	await runScript( 'node ./benchmark/compare-bench-json.js --critical' );
	console.log( '<details><summary>Full Benchmark</summary>' );

	await runScript( 'node ./benchmark/compare-bench-json.js' );
	console.log( '</details>' );

	await git.checkout( currentBranch );

} )();

function runScript( command ) {

	return new Promise( ( resolve, reject ) => {

		const proc = exec( command );
		proc.stderr.pipe( process.stderr );
		proc.stdout.pipe( process.stdout );
		proc.on( 'exit', code => {

			if ( code === 0 ) resolve();
			else reject();

		} );

	} );

}
