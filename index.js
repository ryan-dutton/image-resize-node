const fs = require('fs');
const sharp = require('sharp');
const express = require('express');
const https = require('https')
const app = express();
const port = 443;
require('dotenv').config();

let input_image_types = ['image/jpeg','image/png','image/gif'];
let default_output_format = 'jpeg';
let default_output_format_options = {
	jpeg: {
		quality: 80,
	},
	png: {
		compressionLevel: 9,
		effort: 10,
	},
	gif: {
		effort: 10
	}
};
let test_form = `
<html>
	<script>
		let test = async () => {
			let u = document.getElementById('url').value;
			let w = document.getElementById('width').value;
			let h = document.getElementById('height').value;
			let k = document.getElementById('key').value;
			let f = document.querySelector('input[name="format"]:checked').value;
			let body = JSON.stringify({u,w,h,k,f});
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
	<table border=1>
		<tr>
			<td>URL</td>
			<td><input size="100" type=text id="url" value="https://upload.wikimedia.org/wikipedia/commons/c/c2/Uluru%2C_helicopter_view%2C_cropped.jpg"/></td>
		</tr>
		<tr>
			<td>Width</td>
			<td><input size="5" type=text id="width" value="800"/></td>
		</tr>
		<tr>
			<td>Height</td>
			<td><input size="5" type=text id="height" value="600"/></td>
		</tr>
		<tr>
			<td>Key</td>
			<td><input size="50" type=text id="key" value=""/></td>
		</tr>
		<tr>
			<td>Format</td>
			<td>
				<input selected type=radio name="format" value="png"/>PNG
				<input type=radio name="format" value="jpeg"/>JPEG
				<input type=radio name="format" value="gif"/>GIF
			</td> 
		</tr>
	</table>
	<button type=button onclick="test();">Test</button><br/>
	<img src="" id="output"/>
</html>
`;

app.use(express.json());

app.get('/', (req, res) => {
	res.send(test_form)
})

app.post('/', async (req, res) => {
	try {
		if (!(req.body.k && req.body.k === process.env.KEY)) {
			res.status(401);
			res.send("Invalid key specified.",process.env.KEY);
			return;
		}
		let image_response = await fetch(req.body.u);
		let image_blob = await image_response.blob();
		if (!input_image_types.includes(image_blob.type)) {
			res.status(400);
			res.send("Image URL does not return one of these valid image types: "+input_image_types.join(", "));
			return;
		}
		let format = req.body.f && ['jpeg','gif','png'].includes(req.body.f) ? req.body.f : default_output_format;
		let new_image_buffer =
			await sharp(await image_blob.arrayBuffer())
			.resize(
				parseInt(req.body.w),
				parseInt(req.body.h)
			)
			[format](default_output_format_options[format])
			.toBuffer();
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

https.createServer(options, app).listen(port);