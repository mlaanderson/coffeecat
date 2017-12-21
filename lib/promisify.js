
/**
 * Takes any callback(err, ...) function where the callback is the last argument
 * of the function call and converts it to a promise based function.
 * @param {function} target 
 */
function Promisify(target) {
    var func = target;

    function pFunc(...args) {
        var self = this || null;
        return new Promise((resolve, reject) => {
            args.push(((err, ...results) => {
                if (err) {
                    return reject(err);
                }
                resolve.apply(self, results);
            }).bind(self));

            func.apply(self, args);
        });
    }

    return pFunc;
}

module.exports = Promisify;