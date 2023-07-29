const fs = require('fs');
const sharp = require('sharp');
const express = require('express');
const https = require('https')
const app = express();
const port = 3000;

let input_image_types = ['image/jpeg','image/png','image/gif'];

let test_form = `
<html>
	<script>
		let test = async () => {
			let u = document.getElementById('url').value;
			let w = document.getElementById('width').value;
			let h = document.getElementById('height').value;
			let k = document.getElementById('key').value;
			let body = JSON.stringify({u,w,h});
			console.log(body);
			try {
				let result = await fetch(
					'/',
					{
						method: 'POST',
						body,
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);
				let blob = await result.blob();
				var imageURL = URL.createObjectURL(blob);
				document.getElementById('output').src = imageURL;
				console.log("this is the result:",blob);
			} catch (e) {
				console.log("this is the result:",text);
			}
			
		}
	</script>
	URL:<input size="100" type=text id="url" value="https://www.onthegotours.com/repository/TempleNewImage-209401368023194.jpg"/><br/>
	Width:<input size="5" type=text id="width" value="100"/><br/>
	Height:<input size="5" type=text id="height" value="100"/><br/>
	Key:<input size="50" type=text id="key" value=""/><br/>
	<button type=button onclick="test();">Test</button><br/>
	<img src="" id="output"/>
</html>
`;

//var bodyParser = require('body-parser');
//app.use(bodyParser);

app.use(express.json());

app.get('/', (req, res) => {
	res.send(test_form)
})

app.post('/', async (req, res) => {
	console.log(req.body);
	try {
		let image_response = await fetch(req.body.u);
		let image_blob = await image_response.blob();
		if (!input_image_types.includes(image_blob.type)) {
			res.status(400);
			res.send("Image URL does not return one of these valid image types: "+input_image_types.join(", "));
			return;
		}
		console.log(image_blob);
		let new_image_buffer = await sharp(await image_blob.arrayBuffer()).resize(parseInt(req.body.w),parseInt(req.body.h)).png().toBuffer();
		res.status(200);
		res.send(new_image_buffer);
		return;
	} catch (e) {
		res.status(400);
		res.send(e.message);
		console.log("processing failed with message:", e.message);
		return;
	}
})

var key = fs.readFileSync(__dirname + '/ssl.key');
var cert = fs.readFileSync(__dirname + '/ssl.crt');
var options = {
  key: key,
  cert: cert
};

https.createServer(options, app).listen(443);


//sudo openssl -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com" req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl.key -out ssl.crt