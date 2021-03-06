'use strict';
/**
 * External Dependencies
 */
var path = require( 'path' );
var exec = require( 'child_process' ).execSync;
var fs = require( 'fs' );

/**
 * Internal dependencies
 */
var builder = require( '../lib/tools' );

function DarwinApp( startPath, name ) {
	this.path = startPath;
	this.name = name;
}

DarwinApp.prototype.getFrameworkPlistPath = function( helper ) {
	return path.join( this.path, this.name + '.app', 'Contents', 'Frameworks', this.name + ' Helper ' + helper + '.app', 'Contents', 'Info.plist' );
};

DarwinApp.prototype.getResourcesPath = function( filename ) {
	return path.join( this.path, this.name + '.app', 'Contents', 'Resources', filename );
};

DarwinApp.prototype.getFileList = function( directory ) {
	return fs.readdirSync( this.getResourcesPath( directory ) );
};

DarwinApp.prototype.getReleasePath = function() {
	return path.join( this.path, this.name + '.app' );
};

function cleanBuild( appPath, buildOpts ) {
	var app = new DarwinApp( appPath, buildOpts.name );

	console.log( '\nOptimizing the Mac OS X build at ' + app.getReleasePath() );
	console.log( ' - Renaming helper plist files' );

	exec( "/usr/bin/sed -i '' 's/Electron/" + buildOpts.name + "/' '" + app.getFrameworkPlistPath( 'EH' ) + "'" );
	exec( "/usr/bin/sed -i '' 's/Electron/" + buildOpts.name + "/' '" + app.getFrameworkPlistPath( 'NP' ) + "'" );
	exec( "/usr/bin/sed -i '' 's/com.github.electron/" + buildOpts['app-bundle-id'] + "/' '" + app.getFrameworkPlistPath( 'NP' ) + "'" );
	exec( "/usr/bin/sed -i '' 's/com.github.electron/" + buildOpts['app-bundle-id'] + "/' '" + app.getFrameworkPlistPath( 'EH' ) + "'" );

	console.log( ' - Removing default app' );
	builder.rmdir( app.getResourcesPath( 'default_app' ) );

	console.log( ' - Removing unused localization folders' );
	var lprojFolders = app.getFileList( '' );
	lprojFolders.forEach( function( lprojFolder ) {
		if ( [ 'app', 'atom.asar', 'atom.icns' ].indexOf( lprojFolder ) === -1 ) {
			builder.rmdir( app.getResourcesPath( lprojFolder ) );
		}
	} );

	if ( buildOpts.platform !== 'mas' ) {
		console.log( ' - Signing app' );
		exec( 'codesign --force --sign "' + buildOpts.appSign + '" release/' + buildOpts.name + '-darwin-x64/' + buildOpts.name + '.app/ --deep --timestamp=none' );
	}
}

module.exports = {
	cleaner: cleanBuild
}
