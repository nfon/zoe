//https://github.com/TalAter/annyang/blob/master/docs/README.md
//http://docs.trakt.apiary.io/#introduction/extended-info
"use strict";

var openedWebsite = {};
var firstName = "Nico";
var botName = "Zoé";
var geocoder;
var map;
var pos = {};
var place;
var schedule;
var msg = false;

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;

google.maps.event.addDomListener(window, 'load', initialize);		// setup initial map

// setup initial map
function initialize() {
	var geocoder	= new google.maps.Geocoder();						// create geocoder object
	var latlng		= new google.maps.LatLng(40.6700, -73.9400);		// set default lat/long (new york city)
	var mapOptions	= {													// options for map
		zoom: 8,
		center: latlng
	}
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);	// create new map in the map-canvas div
	var infoWindow = new google.maps.InfoWindow({map: map});
	if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
		$("#location-long").val(pos.lng);
		$("#location-lat").val(pos.lat);

        infoWindow.setPosition(pos);
        infoWindow.setContent('Vous êtes ici.');
        map.setCenter(pos);
		
		var latlng = new google.maps.LatLng(pos.lat, pos.lng);
		geocoder.geocode({'latLng': latlng}, function(results, status) {
		  if (status == google.maps.GeocoderStatus.OK)
			if (results[4]){
				var temp = results[4].formatted_address.split(", ");
				place = {
					city:temp[0],
					country:temp[1]
				};
			}
		});
		
      }, function() {
        //handleLocationError(true, infoWindow, map.getCenter());
      });
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
}

// function to geocode an address and plot it on a map
function codeAddress() {
	var longitude = $("#location-long").val();
	var latitude = $("#location-lat").val();
	getWeather(latitude,longitude);								// get weather for returned lat/long
}

// function to get weather for an address
function getWeather(latitude,longitude) {
	if(latitude != '' && longitude != '') {
		$("#weather").val("Retrieving weather...");										// write temporary response while we get the weather
		$.getJSON( "https://api.openweathermap.org/data/2.5/weather?lat="+latitude+"&lon="+longitude+"&units=metric&lang=fr&APPID=b4a6803e504535d1104054aaf6cdac16", function(data) {	// add '&units=imperial' to get U.S. measurements
			var currWeather					= new Array();								// create array to hold our weather response data
			currWeather['currTemp']			= Math.round(data.main.temp);				// current temperature
			currWeather['highTemp']			= Math.round(data.main.temp_max);			// today's high temp
			currWeather['lowTemp']			= Math.round(data.main.temp_min);			// today's low temp
			currWeather['humidity']			= Math.round(data.main.humidity);			// humidity (in percent)
			currWeather['pressure']			= data.main.pressure * 0.02961339710085;	// barometric pressure (converting hPa to inches)
			currWeather['pressure']			= currWeather['pressure'].toFixed(2);		// barometric pressure (rounded to 2 decimals)
			
			currWeather['description']		= data.weather[0].description;				// short text description (ie. rain, sunny, etc.)
			currWeather['icon']				= "http://openweathermap.org/img/w/"+data.weather[0].icon+".png";	// 50x50 pixel png icon
			currWeather['cloudiness']		= data.clouds.all;							// cloud cover (in percent)
			currWeather['windSpeed']		= Math.round(data.wind.speed);				// wind speed
			
			currWeather['windDegree']		= data.wind.deg;							// wind direction (in degrees)
			currWeather['windCompass']		= Math.round((currWeather['windDegree'] -11.25) / 22.5);	// wind direction (compass value)
			
			// array of direction (compass) names
			var windNames					= new Array("Nord","Nord Nord Est","Nord Est","Est Nord Est","East","Est Sud Est", "Sud Est", "Sud Sud Est","Sud","Sud Sud Ouest","Sud Ouest","Ouest Sud Ouest","Ouest","Ouest Nord Ouest","Nord Ouest","Nord Nord Ouest");
			// array of abbreviated (compass) names
			var windShortNames				= new Array("N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSO","SO","OSO","O","ONO","NO","NNO");
			currWeather['windDirection']	= windNames[currWeather['windCompass']];	// convert degrees and find wind direction name
			
			
			var response 		= "Météo actuelle&nbsp;: "+currWeather['currTemp']+"\xB0 et  le temps est "+currWeather['description'];
			var spokenResponse	= "Il fait "+currWeather['currTemp']+" degrés et le temps est "+currWeather['description'];
			
			if(currWeather['windSpeed']>0) {											// if there's wind, add a wind description to the response
				response		= response+" avec des vents "+windNames[currWeather['windCompass']]+" à "+currWeather['windSpeed'];
				spokenResponse	= spokenResponse+" avec des vents "+windNames[currWeather['windCompass']]+" à "+currWeather['windSpeed'];
				if(currWeather['windSpeed']==1) {
					response		+= " kilomètres heure";
					spokenResponse	+= " kilomètres heure";
				} else {
					response		+= " kilomètres heure";
					spokenResponse	+= " kilomètres heure";
				}
			}
			
			console.log(data);												// log weather data for reference (json format) 
			$("#weather").val(response);									// write current weather to textarea
			speakText(spokenResponse);
		});
	}
	else
		return false;														// respond w/error if no address entered
}

function voyFirst(word){
	var voy=['a','e','i','o','u','y'];
	return voy.indexOf(word[0]) > -1;
}

// function to speak a response
function speakText(response,clear) {
	if (clear == undefined)
		$(".response").text(response);
	else
		$(".response").text($(".response").text()+" "+response);
	// setup synthesis
	if (!msg) {
		msg = new SpeechSynthesisUtterance();
		var voices = window.speechSynthesis.getVoices();
		msg.voice = voices[1];					// Note: some voices don't support altering params
		msg.voiceURI = 'native';
		msg.volume = 1;							// 0 to 1
		msg.rate = 1;							// 0.1 to 10
		msg.pitch = 1;							// 0 to 2
		msg.lang = 'fr-FR';
	}
	msg.text = response;
	speechSynthesis.speak(msg);
}

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '390',
    	width: '640',
	  	videoId: '',
	  	playerVars: { 
			'autoplay': 0,
			'controls': 1,
			'showinfo':0,
			'iv_load_policy':3,
			'autohide':1,
			'rel':0}
	});
}

var scrollTo = function(identifier, speed) {
	$('html, body').animate({
	    scrollTop: $(identifier).offset().top
	}, speed || 1000);
}

$(document).ready(function() {
	$(".firstname").text(firstName);
	$.ajaxSetup({ cache: false });									// make sure we don't cache our JSON request
	startAnnyang();	
});

function startAnnyang(){
	// first we make sure annyang started succesfully
	if (annyang) {

		// define the functions our commands will run.
		var hello = function() {
		  speakText("Bonjour "+firstName);
		  speakText("Vous êtes à "+place.city,false);
		  $("#hello").slideDown("slow");
		  scrollTo("#section_hello");
		};

		var privacy = function() {
			var answers = ["C'est très personnel comme question","Je préfère ne pas en parler","Changeons de sujet, d'accord?","On est obligé de parler de ça ?","Vous êtes bien curieux","Je vais faire comme si je n'avais rien entendu"];
			var rand = Math.floor((Math.random() * answers.length));
			speakText(answers[rand]);
		}

		var repeat = function() {
			speakText($(".response").text());
		}

		var stop = function(){
			confirm();
			speechSynthesis.cancel();
		}

		var sayIt = function(sentence){
			if (sentence.indexOf('à')>0)
				sentence = sentence.replace(' à ',' ');
			if (sentence.indexOf("bonjour">0))
				sentence+=". Comment ça va ?";
			speakText(sentence);
		}

		var getTime = function(){
			var now = new Date();
			speakText("Il est "+now.getHours()+" heures "+(now.getMinutes()==0?"pile":now.getMinutes()));
		};

		var getDate = function(){
			var now = new Date();
			var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
			var days = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
			speakText("Nous sommes le "+days[now.getDay()-1]+" "+now.getDate()+" "+months[now.getMonth()]+" "+now.getFullYear());
		};

		var isWeekend = function(){
			var now = new Date();
			var ret = "";
			switch (now.getDay()) {
				case 0:
				case 1:
				case 2: {
					var ans = ["Oh non !","Pas vraiment"];
					ret = ans[Math.floor((Math.random() * ans.length))];
					break;
				}
				case 3: ret="Bientôt";break;
				case 4: {
					if (now.getHours()<18) 
						ret="Très bientôt"; 
					else 
						ret="WEEKEND"; 
					break;
				}
				case 5: 
				case 6: ret="C'est le weekend";break;
			}
			speakText(ret);
		}

		var isGouter = function(){
			var now = new Date();
			var ret = "";
			if (now.getHours() < 16)
				ret = "Non";
			else
				if (now.getHours()<17)
					ret="Presque !"
				else
					if (now.getHours()==17)
						ret="Oui ! A table !"
					else ret = "C'est trop tard maintenant";
			speakText(ret);
		}

		var isApero = function(){
			var now = new Date();
			var ret = "";
			if (now.getHours() < 18)
				ret = "Non pas encore !";
			else
				if (now.getHours()<18 || (now.getHours()==18 && now.getMinutes()<30) )
					ret="Presque !"
				else
					if ( (now.getHours()==18 && now.getMinutes()>=30) || now.getHours()==19)
						ret="Oui !!  Let's get party started"
					else ret = "C'est trop tard maintenant";
			speakText(ret);
		}

		var autoDestruction = function(){
			speakText("Auto-destruction dans 5. 4. 3. 2. 1. 0 ! L.O.L.");
		}

		var showFlickr = function(tag) {
		  $('#flickrGallery').show();
		  $('#flickrLoader p').text('Searching for '+tag).fadeIn('fast');
		  var url = 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=a828a6571bb4f0ff8890f7a386d61975&sort=interestingness-desc&per_page=9&format=json&callback=jsonFlickrApi&tags='+tag;
		  $.ajax({
		    type: 'GET',
		    url: url,
		    async: false,
		    jsonpCallback: 'jsonFlickrApi',
		    contentType: "application/json",
		    dataType: 'jsonp'
		  });
		  scrollTo("#section_image_search");
		};

		var jsonFlickrApi = function(results) {
		  $('#flickrLoader p').fadeOut('slow');
		  var photos = results.photos.photo;
		  $.each(photos, function(index, photo) {
		    $(document.createElement("img"))
		      .attr({ src: '//farm'+photo.farm+'.staticflickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'_s.jpg' })
		      .addClass("flickrGallery")
		      .appendTo(flickrGallery);
		  });
		};

		var meteo = function() {
			codeAddress();
		}

		var search = function(words) {
			console.log(words);
			var query = words.replace(/ /g,"+");
			var win = window.open("https://www.google.fr/search?q="+query, '_blank');
			openedWebsite["Google"]=win;
			win.focus();
			confirm();
		}

		var openWebsite = function(website) {
			if (website.indexOf('.')>1)
			{
				website = website.split(".");
				var win = window.open("https://"+website[0]+"."+website[1], '_blank');
			}
			else
				var win = window.open("https://"+website+".com", '_blank');
			openedWebsite[website]=win;
			win.focus();
			confirm();
		}

		var closeWebsite = function(website) {
			openedWebsite[website].close();
			confirm();
		}

		var confirm = function() {
			var answers = ["D'accord","OK","Et voilà","C'est fait","C'est good","Let's go","Oki doki"];
			var rand = Math.floor((Math.random() * answers.length));
			speakText(answers[rand]);
		}

		var sir = function(){
			var answers = ["Oui?","Qu'est-ce qu'il y a?","Qui y a t-il?","Que puis-je pour vous?","Oui "+firstName+"?"];
			var rand = Math.floor((Math.random() * answers.length));
			speakText(answers[rand]);
		}

		var showHelp = function(){
			var answers = ["Voilà ce que je sais faire","Je sais faire tout ça","Je peux vous aider à faire tout ça"];
			var rand = Math.floor((Math.random() * answers.length));
			speakText(answers[rand]);
			$("#list").show();
			scrollTo("#list");
		}

		var introduction = function(){
			speakText("Je suis "+botName+", votre assistante virtuelle. Je suis là pour vous aider et vous faire gagner du temps. Vous pouvez connaître la liste des commandes que je comprends en me demandant ce que je sais faire!");
		}

		/*****************/
		/*   YOUTUBE   	 */
		/*****************/
		var openYoutube = function(query) {
			confirm();
			$("#youtube").show();
			scrollTo("#youtube");
			query = query.replace(/ /g,"+");
			var request = gapi.client.youtube.search.list({
				q: query,
				part: 'id,snippet',
				type: 'video',
			});
			request.execute(function(response) {
				var str = JSON.stringify(response.result);
				if (player.loadVideoById) {
					player.loadVideoById({'videoId': response.result.items[0].id.videoId, 'suggestedQuality': 'large'});
				}
			});

			annyang.addCommands({'pause': pauseYoutube});
			annyang.addCommands({'reprend':  {'regexp': /^(reprend|continue)/, 'callback' : playYoutube}});
			annyang.addCommands({'restart':  {'regexp': /^(recommence|encore)/, 'callback' : restartYoutube}});
			annyang.addCommands({'louder':  {'regexp': /^(mets plus fort|plus fort|monte le son)/, 'callback' : louderYoutube}});
			annyang.addCommands({'quiet':  {'regexp': /^(mets moins fort|moins fort|baisse le son|tu peux baisser)/, 'callback' : quietYoutube}});
			annyang.addCommands({'mute':  {'regexp': /^(coupe le son|silence|chut)/, 'callback' : muteYoutube}});
			annyang.addCommands({'stop':  {'regexp': /^(stop|arrete)/, 'callback' : stopYoutube}});
		}

		var pauseYoutube = function(){
			player.pauseVideo();
			confirm();
		}

		var playYoutube = function(){
			player.playVideo();
			confirm();
		}

		var restartYoutube = function(){
			player.seekTo(0);
			player.playVideo();
			confirm();
		}

		var louderYoutube = function(){
			var volume = player.getVolume();
			if (volume==100)
				speakText("Le son est déjà au maximum");
			else
				if (volume==0)
					player.setVolume(50);
				else
					player.setVolume(Math.min(100,volume*1.5));
			confirm();
		}

		var quietYoutube = function(){
			var volume = player.getVolume();
			if (volume==0)
				speakText("Le son est déjà au minimum");
			else
				player.setVolume(volume*0.5);
			confirm();
		}

		var muteYoutube = function(){
			var volume = player.getVolume();
			if (volume==0)
				speakText("Le son est déjà coupé");
			else
				player.setVolume(0);
			confirm();
		}

		var stopYoutube = function(){
			player.stopVideo();
			confirm();
			$("#youtube").hide();
			scrollTo("#input");
			
			annyang.removeCommands(['pause','reprend','restart','louder','quiet','mute','stop']);
		}

		/*****************/
		/*     AGENDA    */
		/*****************/
		var agendaToday = function()
		{
			agenda("aujourd'hui");
		}
		var agendaTomorrow = function()
		{
			agenda("demain");
		}
		var agenda = function(date){
			var now = new Date();
			if (date=="demain") {
				now = new Date(now.setHours(24,0,0,0));
				annyang.removeCommands(['tomorrow']);
				annyang.addCommands({'today':  {'regexp': /^et aujourd\'hui/, 'callback' : agendaToday}});
			}
			else {
				date="aujourd'hui";
				annyang.removeCommands(['today']);
				annyang.addCommands({'tomorrow':  {'regexp': /^et demain/, 'callback' : agendaTomorrow}});
			}
			speakText("");
			var noEvent = true;
			if (schedule.length > 0) {
				for (i = 0; i < schedule.length; i++) {
					var fullDay = false;
					var event = schedule[i];
					if (event.start.dateTime)
						var when = new Date(event.start.dateTime);
					else {
						fullDay = true;
				  		var when = new Date(event.start.date);
					}
			
					if (when.getDate() == now.getDate() && when.getMonth() == now.getMonth() && when.getFullYear() == now.getFullYear() && ( fullDay || when.getHours()>now.getHours() || ( when.getHours()==now.getHours() && when.getMinutes()>now.getMinutes()) ) )
					{
						noEvent = false;
						speakText(event.summary +(fullDay?"":(" à " + when.getHours()+" heures "+(when.getMinutes()==0?"pile":when.getMinutes()))),false);
					}
				}
		    } 
		    if (noEvent)
		    	speakText("Vous n'avez aucun évènement de prévu "+date);
		}
		var createEvent = function(){
			var resource = {
			  "summary": "Appointment",
			  "location": "Somewhere",
			  "start": {
			    "dateTime": "2011-12-16T10:00:00.000-07:00"
			  },
			  "end": {
			    "dateTime": "2011-12-16T10:25:00.000-07:00"
			  }
			};
			var request = gapi.client.calendar.events.insert({
			  'calendarId': 'primary',
			  'resource': resource
			});
			request.execute(function(resp) {
			  console.log(resp);
			});
		}

		/*****************/
		/*      PLAN     */
		/*****************/
		var destination = "";
		var plan = function(dest,travelMode){
			destination=dest;
			console.log(dest);
			if (travelMode==undefined)
				travelMode="bicycling";
			var query = dest.replace(/ /g,"+");
			if (openedWebsite["la carte"])
				openedWebsite["la carte"].close();
			var win = window.open("https://www.google.com/maps/dir/?api=1&destination="+query+"&travelmode="+travelMode, '_blank');
			openedWebsite["la carte"]=win;
			win.focus();
			confirm();

			if (travelMode!="walking")
				annyang.addCommands({'et à pied': planFoot});
			if (travelMode!="driving")
				annyang.addCommands({'et en voiture': planDrive});
			if (travelMode!="bicycling")
				annyang.addCommands({'et en vélo': planBike});
			if (travelMode!="transit")
				annyang.addCommands({'et en métro': planSub});
		}

		var planFoot = function(){
			annyang.removeCommands(['et à pied']);
			plan(destination,"walking");
		}

		var planDrive = function(){
			annyang.removeCommands(['et en voiture']);
			plan(destination,"driving");
		}

		var planBike = function(){
			annyang.removeCommands(['et en vélo']);
			plan(destination,"bicycling");
		}

		var planSub = function(){
			annyang.removeCommands(['et en métro']);
			plan(destination,"transit");
		}

		var velib = function(){
			var url = 'https://opendata.paris.fr/api/records/1.0/search/?dataset=stations-velib-disponibilites-en-temps-reel&lang=fr&facet=banking&facet=bonus&facet=status&facet=contract_name&geofilter.distance='+pos.lat+'%2C'+pos.lng+'%2C1000';
			$.ajax({
				type: 'GET',
				url: url,
				success: function(result) {
					var answer = "Non, désolé."
					if (result.records.length)
					{
						answer = "Oui, il y a ";
						for (var i=0;i<Math.min(3,result.records.length);i++) {
							var station = result.records[i].fields
							var name = station.name.substring(station.name.indexOf('-')+1);
							//var adresse = station.address;
							var bike = station.bike_stands;
							var bike_available = station.available_bikes;
							answer+=bike_available+" vélo"+(bike_available>1?"s":"")+" à la station "+name+" ("+(bike_available*100/bike).toFixed(0)+"%), ";
						}
					}
					answer=answer.substring(0,answer.length-2);
					speakText(answer);
				}
			});
		}

		// define our commands.
		// * The key is the phrase you want your users to say.
		// * The value is the action to do.
		//   You can pass a function, a function name (as a string), or write your function as part of the commands object.
		var commands = {
		  'hello': {'regexp': /^(bonjour|salut|hello)( zoé){0,1}$/, 'callback': hello},
		  'zoe': {'regexp': /^(zoé|test)/, 'callback' : sir},
		  'repeat': {'regexp': /^(répète|pardon|tu peux répéter)( zoé){0,1}$/, 'callback': repeat},
		  'silence': {'regexp': /^(silence|arrete|tais-toi)( zoé){0,1}$/, 'callback': stop},
		  'age': {'regexp': /^(quel âge as-tu|t\'as quel âge|tu as quel âge)( zoé){0,1}$/, 'callback': privacy},
		  'auto-destruction': 	  autoDestruction,
		  'dis *words': 		  sayIt,
		  'quel temps il fait':	  meteo,
		  'show me *search':      showFlickr,
		  'cherche *words': 	  search,
		  'ouvre *words': 	      openWebsite,
		  'ferme *website':	  	  closeWebsite,
		  'introduction': {'regexp': /^(parle moi de toi|qui es-tu|présente-toi)( zoé){0,1}$/, 'callback' : introduction},
		  'help': {'regexp': /^(help|aide|quelles sont les commandes disponibles|que sais tu faire|qu\'est-ce que tu sais faire')( zoé){0,1}$/, 'callback' : showHelp},
		  'heure': {'regexp': /^(quelle heure est-il|quelle heure il est|il est quelle heure)( zoé){0,1}$/, 'callback': getTime},
		  'date': {'regexp': /^(on est quel jour|quel jour on est|on est le combien|le combien sommes-nous)( zoé){0,1}$/, 'callback': getDate},
		  'est-ce que c\'est bientôt le weekend': isWeekend,
		  'est-ce que c\'est l\'heure du goûter': isGouter,
		  'est-ce que c\'est l\'heure de l\'apéro': isApero,
		  'qu\'est-ce que j\ai de prévu aujourd\'hui': {'regexp': /^(qu\'est-ce que j\'ai de prévu|est-ce que j\'ai quelque chose de prévu) (aujourd\'hui)$/, 'callback': agendaToday},
		  'qu\'est-ce que j\ai de prévu demain': {'regexp': /^(qu\'est-ce que j\'ai de prévu|est-ce que j\'ai quelque chose de prévu) (demain)$/, 'callback': agendaTomorrow},
		  'lance *video':		  openYoutube,
		  'guide-moi vers *destination': plan,
		  'est-ce qu\'il y a des Vélib\'':velib,
		};

		// OPTIONAL: activate debug mode for detailed logging in the console
		annyang.debug();

		// Add voice commands to respond to
		annyang.addCommands(commands);

		//annyang.setLanguage('fr');
		annyang.setLanguage("fr-FR");

		// Start listening. You can call this here, or attach this call to an event, button, etc.
		annyang.start();
		annyang.addCallback('start', function(phrases) {
			$(".bubble").css("display","block");
		});
		annyang.addCallback('end', function(phrases) {
			$(".bubble").css("display","none");
		});
		annyang.addCallback('result', function(phrases) {
			$(".input").text(phrases[0].charAt(0).toUpperCase()+phrases[0].substring(1));
			console.log("But then again, it could be any of the following: ", phrases);
		});
		
	} 
	else {
		$(document).ready(function() {
		  $('#unsupported').fadeIn('fast');
		});
	}
}