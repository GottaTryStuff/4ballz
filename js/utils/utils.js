//super inherits from sub
function extend(subConstructor, superConstructor) {
	superConstructor.prototype = Object.create(subConstructor.prototype, {
		constructor : {
			value : superConstructor,
			enumerable : false,
			writable : true,
			configurable : true
		}
	});
}
