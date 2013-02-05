var

fs = require('fs'),
exec = require('child_process').exec,

BASEPATH = __dirname+'/VisualEditor/modules/',
BUILDDIR = __dirname+'/build/',
YUICOMPRESSORPATH = __dirname+'/../yuicompressor/build/yuicompressor-2.4.8pre.jar',

jquery = 'jquery',
modules = ['es/es.js',
'es/es.Html.js',
'es/es.Position.js',
'es/es.Range.js',
'es/es.TransactionProcessor.js',
 
'es/serializers/es.AnnotationSerializer.js',
'es/serializers/es.HtmlSerializer.js',
'es/serializers/es.JsonSerializer.js',
'es/serializers/es.WikitextSerializer.js',

'es/bases/es.EventEmitter.js',
'es/bases/es.DocumentNode.js',
'es/bases/es.DocumentModelNode.js',
'es/bases/es.DocumentBranchNode.js',
'es/bases/es.DocumentLeafNode.js',
'es/bases/es.DocumentModelBranchNode.js',
'es/bases/es.DocumentModelLeafNode.js',
'es/bases/es.DocumentViewNode.js',
'es/bases/es.DocumentViewBranchNode.js',
'es/bases/es.DocumentViewLeafNode.js',
'es/bases/es.Inspector.js',
'es/bases/es.Tool.js',

'es/models/es.SurfaceModel.js',
'es/models/es.DocumentModel.js',
'es/models/es.ParagraphModel.js',
'es/models/es.PreModel.js',
'es/models/es.ListModel.js',
'es/models/es.ListItemModel.js',
'es/models/es.TableModel.js',
'es/models/es.TableRowModel.js',
'es/models/es.TableCellModel.js',
'es/models/es.HeadingModel.js',
'es/models/es.TransactionModel.js',

'es/inspectors/es.LinkInspector.js',

'es/tools/es.ButtonTool.js',
'es/tools/es.AnnotationButtonTool.js',
'es/tools/es.ClearButtonTool.js',
'es/tools/es.HistoryButtonTool.js',
'es/tools/es.ListButtonTool.js',
'es/tools/es.IndentationButtonTool.js',
'es/tools/es.DropdownTool.js',
'es/tools/es.FormatDropdownTool.js',

'es/views/es.SurfaceView.js',
'es/views/es.ToolbarView.js',
'es/views/es.ContentView.js',
'es/views/es.ContextView.js',
'es/views/es.DocumentView.js',
'es/views/es.ParagraphView.js',
'es/views/es.PreView.js',
'es/views/es.ListView.js',
'es/views/es.MenuView.js',
'es/views/es.ListItemView.js',
'es/views/es.TableView.js',
'es/views/es.TableRowView.js',
'es/views/es.TableCellView.js',
'es/views/es.HeadingView.js'],

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
    function(file)
    {
        var filepath = BASEPATH+file;
        
        all += fs.readFileSync(filepath);
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