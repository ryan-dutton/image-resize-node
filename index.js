const fs = require('fs');
const sharp = require('sharp');
const express = require('express');
const fileUpload = require('express-fileupload');

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
			let f = document.querySelector('input[id="format"]:checked').value;
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
			} catch (e) {
				console.log("error processing image:",e.message);
			}
		}
	</script>
	<h1>Remote URL</h1>
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
				<input selected type=radio id="format" value="png"/>PNG
				<input type=radio id="format" value="jpeg"/>JPEG
				<input type=radio id="format" value="gif"/>GIF
			</td> 
		</tr>
	</table>
	<button type=button onclick="test();">Test</button><br/>
	<img src="" id="output"/>
	<hr/>
	<h1>File Upload</h1>
	<form action="/upload" method="POST" enctype="multipart/form-data">
		<table border=1>
			<tr>
				<td>File</td>
				<td><input type="file" name="i" /></td>
			</tr>
			<tr>
				<td>Width</td>
				<td><input size="5" type=text name="w" value="800"/></td>
			</tr>
			<tr>
				<td>Height</td>
				<td><input size="5" type=text name="h" value="600"/></td>
			</tr>
			<tr>
				<td>Key</td>
				<td><input size="50" type=text name="k" value=""/></td>
			</tr>
			<tr>
				<td>Format</td>
				<td>
					<input selected type=radio name="f" value="png"/>PNG
					<input type=radio name="f" value="jpeg"/>JPEG
					<input type=radio name="f" value="gif"/>GIF
				</td> 
			</tr>
		</table>
    	<button type="submit">Upload</button>
	</form>
</html>
`;




app.get('/', (req, res) => {
	res.send(test_form)
})

app.post('/', express.json(), async (req, res) => {
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

app.post('/upload', express.urlencoded(), fileUpload(), async (req, res) => {
	try {
		if (!(req.body.k && req.body.k === process.env.KEY)) {
			res.status(401);
			res.send("Invalid key specified."+req.body.k);
			return;
		}
		let { i } = req.files;
		
		let format = req.body.f && ['jpeg','gif','png'].includes(req.body.f) ? req.body.f : default_output_format;
		let new_image_buffer =
			await sharp(i.data)
			.resize(
				parseInt(req.body.w),
				parseInt(req.body.h)
			)
			[format](default_output_format_options[format])
			.toBuffer();
		res.status(200);
		res.setHeader('content-type', 'image/'+format);
		res.send(new_image_buffer);
		return;
	} catch (e) {
		res.status(400);
		res.send("Error:"+e.message);
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