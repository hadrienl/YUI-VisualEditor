var

fs = require('fs'),
exec = require('child_process').exec,

BASEPATH = __dirname+'/VisualEditor/modules/',
BUILDDIR = __dirname+'/build/',
YUICOMPRESSORPATH = __dirname+'/../yuicompressor/build/yuicompressor-2.4.8pre.jar',

jquery = 'jquery',
modules = ['es', 'es/bases', 'es/inspectors', 'es/models', 'es/serializers', 'es/tools', 'es/views'],
images = ['es/images'],
styles = ['es/styles'],

all = '';

/**
 * Building javascript
 */
try
{
    fs.mkdir(BUILDDIR, '0777');
}
catch (e)
{
    console.error(e);
}
modules.forEach(
    function(path)
    {
        var files = fs.readdirSync(BASEPATH+path);
        
        files.forEach(
            function(file)
            {
                var filepath = BASEPATH+path+'/'+file;
                
                if (!fs.statSync(filepath).isFile())
                {
                    return;
                }
                
                all += fs.readFileSync(filepath);
            }
        );
    }
);
fs.writeFileSync(
    BUILDDIR+'all.js',
    all,
    'utf-8'
);

/**
 * jquery
 */
fs.writeFileSync(
    BUILDDIR+'jquery.js',
    fs.readFileSync(
        BASEPATH+'jquery/jquery.js'
    )
);

/**
 * Copying images
 */
try
{
    fs.mkdir(BUILDDIR+'images', '0777');
}
catch (e)
{
    console.error(e);
}
images.forEach(
    function(path)
    {
        var files = fs.readdirSync(BASEPATH+path);
        
        files.forEach(
            function(file)
            {
                var filepath = BASEPATH+path+'/'+file;
                
                if (!fs.statSync(filepath).isFile())
                {
                    return;
                }
                
                fs.writeFileSync(
                    BUILDDIR+'images/'+file,
                    fs.readFileSync(filepath)
                );
            }
        );
    }
);

/**
 * Copying styles
 * @method/attribute/property name
 * @public/private/protected
 */
all = '';
try
{
    fs.mkdir(BUILDDIR+'styles', '0777');
}
catch (e)
{
    console.error(e);
}
styles.forEach(
    function(path)
    {
        var files = fs.readdirSync(BASEPATH+path);
        
        files.forEach(
            function(file)
            {
                var filepath = BASEPATH+path+'/'+file;
                
                if (!fs.statSync(filepath).isFile())
                {
                    return;
                }
                
                all += fs.readFileSync(filepath);
            }
        );
    }
);
fs.writeFileSync(
    BUILDDIR+'styles/styles.css',
    all,
    'utf-8'
);


/**
 * Compress
 */
exec(
    'java -jar '+YUICOMPRESSORPATH+
    ' --type js --charset utf8 '+
    BUILDDIR+'all.js -o '+
    BUILDDIR+'all-min.js',
    function(err, stdout, stderr)
    {
        if (err)
        {
            console.log(stderr);
        }
    }
);
exec(
    'java -jar '+YUICOMPRESSORPATH+
    ' --type css --charset utf8 '+
    BUILDDIR+'styles/styles.css -o '+
    BUILDDIR+'styles/styles-min.css',
    function(err, stdout, stderr)
    {
        if (err)
        {
            console.log(stderr);
        }
    }
);