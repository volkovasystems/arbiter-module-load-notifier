try{ var base = window; }catch( error ){ var base = exports; }
( function module( base ){
	define( "moduleLoadNotifier",
		[
			"async",
			"arbiter",
			"underscore"
		],
		function construct( async ){
			/*
				The module load notifier does two things,
					1. Handle module loading.
					2. Notify if module is loaded.

				Basically, it will return a moduleLoadHandler function
					and attached to this is the notifier.

				This enables the moduleLoadNotifier to do two things,
					either broadcast that the aggregated modules
					should be notified as loaded or handling the 
					module loading notification.
			*/
			var moduleLoadNotifier = function moduleLoadNotifier( modules ){
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

				var moduleLoadHandler = function moduleLoadHandler( handler ){
					if( typeof handler != "function" ){
						throw new Error( "invalid handler" );
					}
					var moduleNamespace;
					for( var index = 0; index < moduleList.length; index++ ){
						moduleNamespace = moduleList[ index ];
						if( typeof moduleNamespace == "function"
							&& moduleNamespace.name == "moduleLoadHandler" )
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
				};

				moduleLoadHandler.notifyModuleLoaded = function notifyModuleLoaded( ){
					var moduleNamespace;
					for( var index = 0; index < moduleList.length; index++ ){
						moduleNamespace = moduleList[ index ];
						moduleList[ index ] = function onModuleLoad( callback ){
							arbiter.publish( "module-loaded:" + moduleNamespace, null, { "persist": true } );
						};
					}
				};

				return moduleLoadHandler;
			};

			base.moduleLoadNotifier = moduleLoadNotifier;
		} );
} )( base );