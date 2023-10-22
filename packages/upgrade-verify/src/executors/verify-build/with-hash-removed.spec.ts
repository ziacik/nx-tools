import { withHashRemoved } from './with-hash-removed';

describe('withHashRemoved', () => {
	it('removes hashes from file names', () => {
		expect(withHashRemoved('main.f2a45b789e123d56.js')).toEqual('main.js');
		expect(withHashRemoved('main.f2a45b789e123d56.js.map')).toEqual('main.js.map');
	});

	it('does not remove hashes from file names if there are no hashes', () => {
		expect(withHashRemoved('main.js')).toEqual('main.js');
	});

	it('does not remove stuff that looks like hashes but is not (e.g. it is shorter)', () => {
		expect(withHashRemoved('main.f2a45b789e123d5.js')).toEqual('main.f2a45b789e123d5.js');
	});

	it('does not remove .bundle from file names', () => {
		expect(withHashRemoved('main.bundle.js')).toEqual('main.bundle.js');
	});
});
