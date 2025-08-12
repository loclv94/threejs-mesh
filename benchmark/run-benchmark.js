import {
	suite,
	bench,
	beforeAll,
	beforeEach,
} from './lib/bench.js';
import {
	Mesh,
	BufferGeometry,
	TorusGeometry,
	Raycaster,
	Box3,
	Vector3,
	Sphere,
	Matrix4,
	Quaternion,
	Line3,
	PlaneGeometry,
	Triangle,
} from 'three';
import {
	CENTER,
	AVERAGE,
	SAH,
	ExtendedTriangle,
	MeshBVH,
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	getBVHExtremes,
	estimateMemoryInBytes,
} from '../src/index.js';
import { logObjectAsRows } from './lib/logTable.js';
import { generateGroupGeometry } from './utils.js';

Mesh.prototype.raycast = acceleratedRaycast;
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

const LOG_JSON = process.argv.includes( '--json' );
if ( ! LOG_JSON ) {

	const bvh = new MeshBVH( new TorusGeometry( 5, 5, 700, 300 ) );
	console.log( '**Extremes**' );
	logExtremes( bvh );
	console.log();

}

suite( 'BVH General', () => {

	let geometry, bvh, serialized;
	beforeAll( () => {

		geometry = new TorusGeometry( 5, 5, 700, 300 );
		bvh = new MeshBVH( geometry );
		serialized = MeshBVH.serialize( bvh );

	} );

	bench( 'Serialize', 		() => MeshBVH.serialize( bvh ) );
	bench( 'Desrialize', 		() => MeshBVH.deserialize( serialized, geometry ) );

} );

runSuiteWithOptions( '', { indirect: false } );

runSuiteWithOptions( 'Indirect', { indirect: true } );

suite( 'Math Functions', () => {

	let tri1,
		tri2,
		target;
	beforeAll( () => {

		tri1 = new ExtendedTriangle();
		tri2 = new ExtendedTriangle();
		target = new Line3();

		tri1.a.set( - 1, 0, 0 );
		tri1.b.set( 2, 0, - 2 );
		tri1.c.set( 2, 0, 2 );

		tri2.a.set( 1, 0, 0 );
		tri2.b.set( - 2, - 2, 0 );
		tri2.c.set( - 2, 2, 0 );

		tri1.update();
		tri2.update();

	} );

	bench( 'IntersectTri w/o Target', 	() => tri1.intersectsTriangle( tri2 ) );

	bench( 'IntersectTri w/ Target', () => tri1.intersectsTriangle( tri2, target ) );

	bench( 'IntersectTri w/ Update', () => {

		tri2.needsUpdate = true;
		tri1.intersectsTriangle( tri2, target );

	} );

} );

suite( 'Tower Case Geometry', () => {

	let raycaster,
		mesh,
		centerBVH,
		sahBVH,
		averageBVH;

	beforeAll( () => {

		const geometry = new PlaneGeometry( 10, 10, 400, 400 );
		const posAttr = geometry.getAttribute( 'position' );
		for ( let x = 0; x <= 100; x ++ ) {

			for ( let y = 0; y <= 100; y ++ ) {

				const inCenter = x > 100 && x < 300 && y > 100 && y < 300;
				const i = x * 100 + y;
				const z = inCenter ? 50 : - 50;
				posAttr.setZ( i, z + x * 0.01 );

			}

		}

		raycaster = new Raycaster();
		raycaster.ray.origin.set( 100, 100, 100 );
		raycaster.ray.direction.set( - 1, - 1, - 1 );

		mesh = new Mesh( geometry );

		centerBVH = new MeshBVH( geometry, { strategy: CENTER } );
		averageBVH = new MeshBVH( geometry, { strategy: AVERAGE } );
		sahBVH = new MeshBVH( geometry, { strategy: SAH } );

	} );

	bench( 'CENTER raycast',
		() => mesh.geometry.boundsTree = centerBVH,
		() => mesh.raycast( raycaster, [] ),
	);

	bench( 'AVERAGE raycast',
		() => mesh.geometry.boundsTree = averageBVH,
		() => mesh.raycast( raycaster, [] )
	);

	bench( 'SAH raycast',
		() => mesh.geometry.boundsTree = sahBVH,
		() => mesh.raycast( raycaster, [] )
	);

} );

function logExtremes( bvh ) {

	const extremes = getBVHExtremes( bvh )[ 0 ];
	const bvhSize = estimateMemoryInBytes( bvh._roots );
	const serializedSize = estimateMemoryInBytes( MeshBVH.serialize( bvh ).roots );

	logObjectAsRows( {
		memory: `${ bvhSize / 1000 } kb`,
		serialized: `${ serializedSize / 1000 } kb`,
		'total nodes': `${ extremes.nodeCount }`,
		triangles: `${extremes.tris.min}, ${extremes.tris.max}`,
		depth: `${extremes.depth.min}, ${extremes.depth.max}`,
		splits: `${extremes.splits[ 0 ]}, ${extremes.splits[ 1 ]}, ${extremes.splits[ 2 ]}`,
		'surface area score': `${extremes.surfaceAreaScore.toFixed( 6 )}`,
	} );

}

function runSuiteWithOptions( name, options ) {

	suite( `${ name } BVH Casts`, () => {

		let OG_GEOMETRY,
			OG_GROUP_GEOMETRY,
			OG_INTERSECTS_GEOMETRY,
			geometry,
			groupGeometry,
			mesh,
			bvh,
			intersectBvh,
			raycaster,
			firstHitRaycaster,
			box,
			boxMat,
			sphere,
			refitHints,
			intersectGeometry,
			intersectMatrix,
			target1,
			target2,
			point;

		beforeAll( () => {

			OG_GEOMETRY = new TorusGeometry( 5, 5, 700, 300 );
			OG_GROUP_GEOMETRY = generateGroupGeometry( 200 );
			OG_INTERSECTS_GEOMETRY = new TorusGeometry( 5, 5, 30, 10 );

			raycaster = new Raycaster();
			raycaster.ray.origin.set( 10, 20, 30 );
			raycaster.ray.direction.set( - 1, - 2, - 3 );

			firstHitRaycaster = new Raycaster();
			firstHitRaycaster.firstHitOnly = true;
			firstHitRaycaster.ray.origin.set( 10, 20, 30 );
			firstHitRaycaster.ray.direction.set( - 1, - 2, - 3 );

			point = new Vector3();

		} );

		beforeEach( () => {

			groupGeometry = OG_GROUP_GEOMETRY.clone();

			geometry = OG_GEOMETRY.clone();
			bvh = new MeshBVH( geometry, options );
			geometry.boundsTree = bvh;

			intersectGeometry = OG_INTERSECTS_GEOMETRY.clone();
			intersectBvh = new MeshBVH( intersectGeometry, options );
			intersectMatrix = new Matrix4().compose( new Vector3(), new Quaternion(), new Vector3( 0.1, 0.1, 0.1 ) );

			mesh = new Mesh( geometry );

			sphere = new Sphere( new Vector3(), 3 );

			box = new Box3();
			box.min.set( - 1, - 1, - 1 );
			box.min.set( 1, 1, 1 );

			boxMat = new Matrix4().identity();

			const intersectSphere = new Sphere( new Vector3(), 0.5 );
			refitHints = new Set();
			bvh.shapecast( {

				intersectsBounds: ( box, isLeaf, score, depth, nodeIndex ) => {

					if ( box.intersectsSphere( intersectSphere ) ) {

						refitHints.add( nodeIndex );
						return true;

					}

					return false;

				}

			} );

			target1 = {};
			target2 = {};

		} );

		bench( 'Compute BVH',
			() => geometry = OG_GEOMETRY.clone(),
			() => geometry.computeBoundsTree( options ),
		);
		bench( 'Compute BVH w/ groups',
			() => groupGeometry = OG_GROUP_GEOMETRY.clone(),
			() => groupGeometry.computeBoundsTree( options ),
		);
		bench( 'Raycast', 					() => mesh.raycast( raycaster, [] ) );
		bench( 'Raycast Shapecast',			() => {

			const target = new Vector3();
			const ray = raycaster.ray;
			const results = [];
			bvh.shapecast( {

				intersectsBounds: box => ray.intersectsBox( box ),
				intersectsTriangle: tri => {

					if ( ray.intersectTriangle( tri.a, tri.b, tri.c, false, target ) ) {

						results.push( target.clone() );

					}

				},

			} );

	 	} );
		 bench( 'Raycast First Hit', 		() => mesh.raycast( firstHitRaycaster, [] ) );
		 bench( 'Raycast First Hit Shapecast', () => {

			const boxVec = new Vector3();
			const target = new Vector3();
			const ray = raycaster.ray;
			let closestHit = Infinity;
			let result = null;
			bvh.shapecast( {

				boundsTraverseOrder: ( box, xyzAxis, isLeft ) => {

					if ( ray.intersectBox( box, boxVec ) ) {

						return ray.origin.distanceToSquared( boxVec );

					} else {

						return Infinity;

					}

				},
				intersectsBounds: ( box, isLeaf, score ) => {

					return score < closestHit;

				},
				intersectsTriangle: tri => {

					if ( ray.intersectTriangle( tri.a, tri.b, tri.c, false, target ) ) {

						const dist = ray.origin.distanceToSquared( target );
						if ( dist < closestHit ) {

							closestHit = dist;
							result = target.clone();

						}

					}

				},

			} );

	 	} );

		bench( 'Sphere Shapecast', 			() => bvh.shapecast( {

			intersectsBounds: box => sphere.intersectsBox( box ),
			intersectsTriangle: tri => tri.intersectsSphere( sphere ),

		} ) );
		bench( 'IntersectsSphere', 			() => bvh.intersectsSphere( sphere ) );
		bench( 'IntersectsBox', 			() => bvh.intersectsBox( box, boxMat ) );

		bench( 'DistanceToGeometry w/ BVH',
			() => intersectGeometry.boundsTree = intersectBvh,
			() => bvh.closestPointToGeometry( intersectGeometry, intersectMatrix, target1, target2 ).distance,
		);
		bench( 'DistanceToPoint', 			() => bvh.closestPointToPoint( point, target1 ).distance );

		bench( 'IntersectsGeometry w/ BVH',
			() => intersectGeometry.boundsTree = intersectBvh,
			() => bvh.intersectsGeometry( intersectGeometry, intersectMatrix ),
		);
		bench( 'IntersectsGeometry w/o BVH', () => bvh.intersectsGeometry( intersectGeometry, intersectMatrix ) );

		bench( 'BVHCast', () => bvh.bvhcast( intersectBvh, intersectMatrix, {

			intersectsTriangles( tri1, tri2 ) {

				tri1.update();
				tri2.update();
				tri1.intersectsTriangle( tri2 );

			}

		} ) );

	} );

	suite( `${ name } BVH Misc`, () => {

		let geometry,
			bvh,
			box,
			refitHints;

		beforeAll( () => {

			geometry = new TorusGeometry( 5, 5, 700, 300 );
			bvh = new MeshBVH( geometry, options );

			box = new Box3();

			const intersectSphere = new Sphere( new Vector3( 0, 0, 0 ), 0.5 );
			refitHints = new Set();
			bvh.shapecast( {

				intersectsBounds: ( box, isLeaf, score, depth, nodeIndex ) => {

					if ( box.intersectsSphere( intersectSphere ) ) {

						refitHints.add( nodeIndex );
						return true;

					}

					return false;

				}

			} );

		} );

		bench( 'Refit', 			() => bvh.refit() );
		bench( 'Refit with Hints', 	() => bvh.refit( refitHints ) );

		bench( 'Compute Bounds', () => bvh.getBoundingBox( box ) );
		bench( 'Compute Bounds w/o', () => geometry.computeBoundingBox() );

	} );

}
