try{ var base = window; }catch( error ){ var base = exports; }
( function module( base ){
	define( "moduleLoader",
		[
			"async",
			"arbiter",
			"underscore"
		],
		function construct( async ){
			var moduleLoader = function moduleLoader( modules ){
				//This is the default namespace.
				var arbiter = Arbiter;
				
				var moduleList = Array.prototype.slice.apply( arguments );
				
				var moduleNamespace;
				for( var index = 0; index < moduleList.length; index++ ){
					moduleNamespace = moduleList[ index ];
					if( moduleNamespace instanceof Arbiter ){
						arbiter = moduleNamespace;
						moduleList[ index ] = null;
					}else if( typeof moduleNamespace != "string"
						&& typeof moduleNamespace == "function"
						&& moduleNamespace.name == "notifyModuleLoaded" )
					{
						throw new Error( "invalid module namespace" );
					}
				}
				
				moduleList = _.compact( moduleList );
				
				return {
					"notify": function notifyModuleLoaded( handler ){
						if( typeof handler != "function" ){
							throw new Error( "invalid handler" );
						}
						var moduleNamespace;
						for( var index = 0; index < moduleList.length; index++ ){
							moduleNamespace = moduleList[ index ];
							if( typeof moduleNamespace == "function"
								&& moduleNamespace.name == "notifyModuleLoaded" )
							{
								moduleList[ index ] = function onModuleLoad( callback ){
									moduleNamespace( callback );
								}
							}else{
								moduleList[ index ] = function onModuleLoad( callback ){
									arbiter.subscribe( "module-loaded:" + moduleNamespace, callback );
								};	
							}
						}
						async.parallel( moduleList, handler );
					},

					"onLoad": function onModuleLoaded( ){
						var moduleNamespace;
						for( var index = 0; index < moduleList.length; index++ ){
							moduleNamespace = moduleList[ index ];
							moduleList[ index ] = function onModuleLoad( callback ){
								arbiter.publish( "module-loaded:" + moduleNamespace, null, { "persist": true } );
							};
						}
					}
				};
			};

			base.moduleLoader = moduleLoader;
		} );
} )( base );