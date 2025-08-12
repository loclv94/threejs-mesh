import { Vector3, Triangle, Sphere, Plane } from 'three';
import { sphereIntersectTriangle } from '../src/math/MathUtilities.js';
import { setRandomVector } from './utils.js';

describe( 'Sphere Intersections', () => {

	it( 'should intersect triangles with a vertex inside', () => {

		const sphere = new Sphere();
		sphere.radius = 1;
		setRandomVector( sphere.center, 10 );

		const triangle = new Triangle();
		for ( let i = 0; i < 100; i ++ ) {

			const fields = [ 'a', 'b', 'c' ];
			const i0 = i % 3;
			const i1 = ( i + 1 ) % 3;
			const i2 = ( i + 2 ) % 3;

			setRandomVector( triangle[ fields[ i0 ] ], Math.random() - 0.0001 )
				.add( sphere.center );

			setRandomVector( triangle[ fields[ i1 ] ], 1 + 0.0001 + Math.random() )
				.add( sphere.center );

			setRandomVector( triangle[ fields[ i2 ] ], 1 + 0.0001 + Math.random() )
				.add( sphere.center );

			expect( sphereIntersectTriangle( sphere, triangle ) ).toBe( true );

		}

	} );

	it( 'should intersect triangles with two vertices inside', () => {

		const sphere = new Sphere();
		sphere.radius = 1;
		setRandomVector( sphere.center, 10 );

		const triangle = new Triangle();
		for ( let i = 0; i < 100; i ++ ) {

			const fields = [ 'a', 'b', 'c' ];
			const i0 = i % 3;
			const i1 = ( i + 1 ) % 3;
			const i2 = ( i + 2 ) % 3;

			setRandomVector( triangle[ fields[ i0 ] ], Math.random() - 0.0001 )
				.add( sphere.center );

			setRandomVector( triangle[ fields[ i1 ] ], Math.random() - 0.0001 )
				.add( sphere.center );

			setRandomVector( triangle[ fields[ i2 ] ], 1 + 0.0001 + Math.random() )
				.add( sphere.center );

			expect( sphereIntersectTriangle( sphere, triangle ) ).toBe( true );

		}

	} );

	it( 'should intersect triangles with all vertices inside', () => {

		const sphere = new Sphere();
		sphere.radius = 1;
		setRandomVector( sphere.center, 10 );

		const triangle = new Triangle();
		for ( let i = 0; i < 100; i ++ ) {

			const fields = [ 'a', 'b', 'c' ];
			const i0 = i % 3;
			const i1 = ( i + 1 ) % 3;
			const i2 = ( i + 2 ) % 3;

			setRandomVector( triangle[ fields[ i0 ] ], Math.random() - 0.0001 )
				.add( sphere.center );

			setRandomVector( triangle[ fields[ i1 ] ], Math.random() - 0.0001 )
				.add( sphere.center );

			setRandomVector( triangle[ fields[ i2 ] ], Math.random() - 0.0001 )
				.add( sphere.center );

			expect( sphereIntersectTriangle( sphere, triangle ) ).toBe( true );

		}

	} );

	it( 'should intersect triangles that only intersect the middle', () => {

		const sphere = new Sphere();
		sphere.radius = 1;
		setRandomVector( sphere.center, 10 );

		const triangle = new Triangle();
		for ( let i = 0; i < 100; i ++ ) {

			const fields = [ 'a', 'b', 'c' ];
			const i0 = i % 3;
			const i1 = ( i + 1 ) % 3;
			const i2 = ( i + 2 ) % 3;

			setRandomVector( triangle[ fields[ i0 ] ], 1 + 0.0001 + Math.random() );

			triangle[ fields[ i1 ] ]
				.copy( triangle[ fields[ i0 ] ] )
				.multiplyScalar( - 1 )
				.add( sphere.center );

			triangle[ fields[ i0 ] ]
				.add( sphere.center );

			setRandomVector( triangle[ fields[ i2 ] ], 1 + 0.0001 + Math.random() )
				.add( sphere.center );

			expect( sphereIntersectTriangle( sphere, triangle ) ).toBe( true );

		}

	} );

	it( 'should not intersect triangles outside sphere', () => {

		const sphere = new Sphere();
		sphere.radius = 1;
		setRandomVector( sphere.center, 10 );

		const plane = new Plane();
		const vec = new Vector3();

		const triangle = new Triangle();
		for ( let i = 0; i < 100; i ++ ) {

			// project the triangle out onto a plane
			setRandomVector( plane.normal, 1 );
			plane.setFromNormalAndCoplanarPoint( plane.normal, sphere.center );
			plane.constant += ( Math.sign( Math.random() - 0.5 ) || 1 ) * 1.001;

			const fields = [ 'a', 'b', 'c' ];
			const i0 = i % 3;
			const i1 = ( i + 1 ) % 3;
			const i2 = ( i + 2 ) % 3;

			setRandomVector( vec, 10 * Math.random() )
				.add( sphere.center );
			plane.projectPoint( vec, triangle[ fields[ i0 ] ] );

			setRandomVector( vec, 10 * Math.random() )
				.add( sphere.center );
			plane.projectPoint( vec, triangle[ fields[ i1 ] ] );

			setRandomVector( vec, 10 * Math.random() )
				.add( sphere.center );
			plane.projectPoint( vec, triangle[ fields[ i2 ] ] );

			expect( sphereIntersectTriangle( sphere, triangle ) ).toBe( false );

		}

	} );

} );
