var FolderZip = require('folder-zip');
var package = require('./package.json');

var options = {
	excludeParentFolder: false,
	parentFolderName: package.name,
};

//zip a folder and change folder destination name
var zip = new FolderZip();
zip.zipFolder('dist', options, function(){
	zip.writeToFile(`../../publish/${package.name}-v${package.version}.zip`);
});
