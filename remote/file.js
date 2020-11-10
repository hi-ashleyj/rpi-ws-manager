let Filer = {};

Filer.get = async function(file) {
    return new Promise((resolve, reject) => {
        try {
            let reader = new FileReader();
            reader.onloadend = function(_e) {
                let data = reader.result.slice(reader.result.lastIndexOf(",") + 1);
                resolve(data);
            };
            reader.readAsDataURL(file);
        } catch (err) { resolve(err) }
    });
};