var cover_box, cover_img, input, input_file,
	current_time, total_time, control_btn, favicon,
	canvas, info_tile, info_album, info_file,
	progress, progress_bar, tune_btn, ranges, notification;

var source, filters, buffer, paused, startedAt, pausedAt, currentTime, totalTime, ctx, a2;
var context, analyser;

var presets = {
	'pop':     [-2.3, -1.5,    0,  2.6,  4.7,  4.7,  2.3,    0, -1.5, -2.8],
	'rock':    [ 3.9,  2.8,  0.4, -2.6, -3.9, -4.4, -1.2,    2,  3.4,  4.2],
	'jazz':    [ 4.4,  2.6,  0.7,  1.8, -3.1, -3.1,    0,  1.5,  3.1,  3.9],
	'classic': [ 5.3,  4.4,  2.8,    2, -1.8, -1.8,    0,    2,  2.8,  3.6],
	'normal':  [ 0,      0,    0,    0,    0,    0,    0,    0,    0,    0]
};

function init(){
	canvas = document.querySelector('canvas');
	cover_box = document.querySelector('#cover_box');
	cover_img = document.querySelector('#cover_img');
	input = document.querySelector('#input');
	control_btn = document.querySelector('#control_btn');
	current_time = document.querySelector('.time .current');
	total_time = document.querySelector('.time .total');
	info_tile = document.querySelector('.track_info .title');
	info_album = document.querySelector('.track_info .album');
	info_file = document.querySelector('.track_info .file_name');
	progress = document.querySelector('#progress');
	progress_bar = document.querySelector('#progress_bar');
	tune_btn = document.querySelector('#tune_btn');
	tune_list = document.querySelector('.tune_list');
	ranges = document.querySelectorAll('#ekvalayzer_list .range');
	notification = document.querySelector('#notification');
	favicon =  document.querySelector('link[rel="shortcut icon"]');
	input_file = document.createElement('input');
	input_file.type = 'file';


	tune_btn.onclick = function(e){
		tune_list.classList.toggle('view');
	};

	window.onclick = function(e){
		if(e.target!=tune_btn)tune_list.classList.remove('view');
	}

	ctx=canvas.getContext("2d");

	control_btn.onclick = toggle;
	progress_bar.onclick = setPosition;

	window.ondragover = handleDragOver;
	window.ondragleave = handleDragleave;
	window.ondrop = handleDrop;
	window.onchange = handleDrop;


	if(window.AudioContext){
		context = new AudioContext();
		analyser = context.createAnalyser();
		analyser.smoothingTimeConstant=0.9;
		analyser.fftSize=64;
		a2 = new Uint8Array(analyser.frequencyBinCount);

		createFilters();
		createInputs();
		animate();
	}else{
		showNotification('AudioContext не поддерживается');
	}
}

function handleDrop(event){
	event.stopPropagation();
	event.preventDefault();
	control_btn.className = '';
	buffer = false;
	if(source)stop();
	pausedAt=0;

	var file =  event.target.type=='file'?event.target.files[0]:event.dataTransfer.files[0];

	if(~['mp3','wav','ogg', 'acc'].indexOf(file.name.split('.').pop().toLowerCase())){
		control_btn.className = '';

		var reader = new FileReader();
		reader.onload = function(e) {
			context.decodeAudioData(e.target.result, onBufferLoad, onBufferError);
		};
		reader.readAsArrayBuffer(file);
		loadTags(file);
	}else{
		showNotification('Формат файла не поддерживается');
	}
	return false
}

function handleDragOver(event) {
	event.stopPropagation();
	event.preventDefault();
	cover_box.style.overflow = 'hidden';
	cover_box.classList.add('hover');
	cover_box.classList.remove('drop');
	return false;
}

function handleDragleave(event) {
	cover_box.classList.remove('hover');
	return false;
}

function openFile(){
	event.preventDefault();
	input_file.click();
}



function play(){
	source = context.createBufferSource();
	source.buffer = buffer;

	paused = false;

	source.connect(filters[0]);
	filters[filters.length - 1].connect(analyser);
	filters[filters.length - 1].connect(context.destination);

	if (pausedAt) {
		startedAt = Date.now() - pausedAt;
		source.start(0, pausedAt / 1000);
	}
	else {
		startedAt = Date.now();
		source.start(0);
	}
	control_btn.className = 'pause';
}


function stop(){
	source.stop(0);
	pausedAt = Date.now() - startedAt;
	paused = true;
	control_btn.className = 'play';
}


function toggle(){
	if(buffer)paused?play():stop();
}

function setPosition(e){
	if(buffer){	
		stop();
		pausedAt=totalTime*((e.clientX-this.getBoundingClientRect().left)/this.clientWidth);
		play();
	}
}


function onBufferLoad(b) {
	buffer = b;
	play();
	control_btn.className = 'pause';
	totalTime = source.buffer.duration*1000;
	total_time.textContent = toMin(totalTime);
}

function onBufferError(e) {
	console.error('onBufferError', e);
	showNotification('Ошибка буфера');
}

function loadTags(file){
	var url = file.urn ||file.name;
	ID3.loadTags(url, function() {
		var tags = ID3.getAllTags(url);
		console.log(tags);

		info_tile.textContent = document.title = info_tile.title = tags.title;
		info_album.textContent = info_album.title = tags.artist+(tags.album?(' — '+tags.album):'');
		info_file.textContent = info_file.title = url;
		current_time.textContent = '00:00';
		total_time.textContent = '00:00';

		if(tags.picture){
			var imageData = tags.picture.data; var base64String = "";
			for (var i = 0; i < imageData.length; i++)base64String+=String.fromCharCode(imageData[i]);
			cover_img.src = favicon.href = "data:" + tags.picture.format + ";base64," + window.btoa(base64String);
		}else{
			cover_img.src = 'img/default.png';
			favicon.href = 'favicon.ico';
		}


		cover_box.classList.remove('hover');
		cover_box.classList.add('drop');

		setTimeout(function(){
			cover_box.style.overflow = 'visible';
		},1000);

	},{
		tags: ["artist", "title", "album", "picture"],
		dataReader: FileAPIReader(file)
	});
}

function toMin(s){
	var date = new Date(null);
	date.setSeconds(s/1000);
	date = date.toISOString();
	return date.substring(date.substring(11,13)>0?11:14, 19);
}

function showNotification(msg){
	notification.textContent = msg;
	notification.classList.add('view');
	setTimeout(function(){
		notification.classList.remove('view');
	}, 3000);
}

function createFilter(frequency) {
	var filter = context.createBiquadFilter();
	 
	filter.type = 'peaking'; // тип фильтра
	filter.frequency.value = frequency; // частота
	filter.Q.value = 1;      // Добротность
	filter.gain.value = 0;   //Уровень Дб

	return filter;
}

function createFilters() {
	var frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

	filters = frequencies.map(createFilter);
	filters.reduce(function (prev, curr) {
		prev.connect(curr);
		return curr;
	});
}

var values = [];
function setRange(id, value){
	values[id] = value;
	if(id>=0){
		filters[id].gain.value = values[id]+values[-1];
	}else{
		for(var i=0; i<filters.length; i++)filters[i].gain.value = values[i]+values[-1];
	}
	ranges[id+1].style.height = (value+12)/24*100+'%';
}

var target = false;
function rangeOnMove(e){
	if(target){	
		var range = target.children[0];
		var li = target.getBoundingClientRect();
		var value = (((e.clientY-li.top)/li.height)-0.5)*-24;
		if(value<-12)value=-12;
		if(value>12)value=12;
		setRange(parseInt(target.getAttribute('f-id')), value);
	}
}



function createInputs(){
	var li = document.querySelectorAll('#ekvalayzer_list li');
	for(var i=0; i<li.length; i++){
		values[i-1] = 0;

		if(i){
			var hz = filters[i-1].frequency.value;
			li[i].title = hz%1000? hz+' Hz':hz/1000+' kHz';
		}

		li[i].setAttribute('f-id', i-1);
		li[i].addEventListener('mousedown', function(e){
			target = this;
			target.children[0].classList.add('noanim');
			rangeOnMove(e);
		}, false);
	}

	window.addEventListener('mouseup', function(){
		if(target)target.children[0].classList.remove('noanim');
		target = false;
	}, false);

	window.addEventListener('mousemove', rangeOnMove, false);
}

function setPreset(value, btn){
	tune_list.classList.remove('view');
	var list = document.querySelectorAll('.tune_list li');
	for(var i=0; i<list.length; i++)list[i].classList.remove('active');
	if(btn)btn.classList.add('active');

	for(var i=0; i<filters.length; i++) setRange(i, presets[value][i]);
	setRange(-1, 0);
}



function animate(){
	var a = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(a);

	var b,c;
	b=c=a.length;

	ctx.clearRect(0,0,canvas.width,canvas.height);
	while(b--){
		if(!a2[b]||a[b]>a2[b])a2[b]=a[b];
		if(a2[b]>0)a2[b]--;

		var n1 = 6;
		var n2 = 11;

		var grd=ctx.createLinearGradient(0,canvas.height-(a[b]/2),0,canvas.height);
		grd.addColorStop(0, "rgba(255,255,255,.4)");
		grd.addColorStop(.9, "rgba(255,255,255, 0)");
		ctx.fillStyle=grd;

		ctx.fillRect(n2*b,canvas.height-a[b]/2,n1,a[b]/2);
		ctx.fillStyle = "rgba(255,255,255,.6)";
		ctx.fillRect(n2*b,canvas.height-a2[b]/2-n1,n1,2);
	 }

	 if(startedAt&&Date.now()-startedAt<totalTime&&!paused){
		current_time.textContent = toMin(Date.now() - startedAt);
		progress.style.width = (Date.now() - startedAt)/(totalTime/10)*10+'%';
	 }else if(startedAt&&!paused){
		pausedAt=0;
		play();
		stop();
	 }
	 requestAnimationFrame(animate);
}

window.addEventListener('load', init, false);