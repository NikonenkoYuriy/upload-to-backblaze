<?php

if ( isset($_POST['file-opt'])) {
	
	$files = $_POST['file-opt'];
	$files_opt = explode(",", $files);
	getListBuckets ($files_opt);
}

if ( isset($_POST['upload_part_of_file'])) {
	$upload_part = $_POST['upload_part_of_file'];
	getUploadPartUrl ($upload_part);
	
}

if(isset($_POST['data_success_file'])) {
    $file = $_POST['data_success_file']; 
    echo  $file;  
}

function getStartSettings () {
	
	$application_key_id = ""; 
    $application_key = ""; 
	
	$credentials = base64_encode($application_key_id . ":" . $application_key);
	$url = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account";
	$session = curl_init($url);

	// Add headers
	$headers = array();
	$headers[] = "Accept: application/json";
	$headers[] = "Authorization: Basic " . $credentials;
	curl_setopt($session, CURLOPT_HTTPHEADER, $headers);  // Add headers
	curl_setopt($session, CURLOPT_HTTPGET, true);  // HTTP GET
	curl_setopt($session, CURLOPT_RETURNTRANSFER, true); // Receive server response
	$server_output = curl_exec($session);
	curl_close ($session);
    return json_decode($server_output);
	
}

function getListBuckets ($files_opt) {
	
	$objStartSett = getStartSettings ();
	$account_id = $objStartSett->accountId; // Obtained from your B2 account page
	$api_url = $objStartSett->apiUrl; // From b2_authorize_account call
	$auth_token = $objStartSett->authorizationToken; // From b2_authorize_account call
	$session = curl_init($api_url .  "/b2api/v2/b2_list_buckets");
	// Add post fields
	$data = array("accountId" => $account_id);
	$post_fields = json_encode($data);
	curl_setopt($session, CURLOPT_POSTFIELDS, $post_fields); 

	// Add headers
	$headers = array();
	$headers[] = "Authorization: " . $auth_token;
	curl_setopt($session, CURLOPT_HTTPHEADER, $headers); 

	curl_setopt($session, CURLOPT_POST, true); 
	curl_setopt($session, CURLOPT_RETURNTRANSFER, true);   
	$server_output = curl_exec($session); 
	curl_close ($session); 
	
	$bigFile = 40 * (1024 * 1024);
	
	if ($files_opt[2] < $bigFile) {
		
		getFileUploadUrl ($objStartSett, $server_output, $files);
		
	} else {
		
		getUrlBigFile ($objStartSett, $server_output, $files_opt);
		
	}

}


function getFileUploadUrl ($objStartSett, $buckets, $files) {
	
	$manage = json_decode($buckets, true);
	$api_url = $objStartSett->apiUrl; // From b2_authorize_account call
	
	$auth_token = $objStartSett->authorizationToken; // From b2_authorize_account call
	$bucket_id = $manage['buckets'][0]['bucketId'];  // The ID of the bucket you want to upload to
	
    //echo $buckets;
	$session = curl_init($api_url .  "/b2api/v2/b2_get_upload_url");

	// Add post fields
	$data = array("bucketId" => $bucket_id);
	$post_fields = json_encode($data);
	curl_setopt($session, CURLOPT_POSTFIELDS, $post_fields); 

	// Add headers
	$headers = array();
	$headers[] = "Authorization: " . $auth_token;
	curl_setopt($session, CURLOPT_HTTPHEADER, $headers); 

	curl_setopt($session, CURLOPT_POST, true); // HTTP POST
	curl_setopt($session, CURLOPT_RETURNTRANSFER, true);  // Receive server response
	$server_output = curl_exec($session); // Let's do this!
	curl_close ($session); // Clean up
	echo ($server_output); // Tell me about the rabbits, George!
	//uploadFiles ($server_output, $files);
}



function getUrlBigFile ($objStartSett, $buckets, $files) {
	
	$manage = json_decode($buckets, true);
	$file_name = $files[0]; // File to be uploaded
	$bucket_id = $manage['buckets'][0]['bucketId']; // Provided by b2_create_bucket, b2_list_buckets
	$account_auth_token = $objStartSett->authorizationToken;
	$api_url = $objStartSett->apiUrl;
	$content_type = $files[1]; // The content type of the file. See b2_start_large_file documentation for more information.
	
	// Construct the JSON to post
	$data = array("fileName" => $file_name, "bucketId" => $bucket_id, "contentType" => $content_type);
	$post_fields = json_encode($data);

	// Setup headers
	$headers = array();
	$headers[] = "Accept: application/json";
	$headers[] = "Authorization: " . $account_auth_token;

	// Setup curl to do the post
	$session = curl_init($api_url . "/b2api/v2/b2_start_large_file");
	curl_setopt($session, CURLOPT_HTTPHEADER, $headers);  // Add headers
	curl_setopt($session, CURLOPT_POSTFIELDS, $post_fields); 
	curl_setopt($session, CURLOPT_RETURNTRANSFER, true); // Receive server response
	// Post the data
	$server_output = curl_exec($session);
	curl_close ($session);
	echo $server_output;
	//getUploadPartUrl ($objStartSett, $server_output);
	
}

function getUploadPartUrl ($response) {

	$obj_start_sett = getStartSettings ();

	$api_url = $obj_start_sett->apiUrl;
	$file_id = $response; // Obtained from b2_start_large_file
	$account_auth_token = $obj_start_sett->authorizationToken; // Obtained from b2_authorize_account
	
	$data = array("fileId" => $file_id);
	$post_fields = json_encode($data);

	// Setup headers
	$headers = array();
	$headers[] = "Accept: application/json";
	$headers[] = "Authorization: " . $account_auth_token;

	//  Setup curl to do the post
	$session = curl_init($api_url . "/b2api/v2/b2_get_upload_part_url");
	curl_setopt($session, CURLOPT_HTTPHEADER, $headers);  // Add headers
	curl_setopt($session, CURLOPT_POSTFIELDS, $post_fields); 
	curl_setopt($session, CURLOPT_RETURNTRANSFER, true); // Receive server response
	$server_output = curl_exec($session);
	curl_close ($session);
	$server_output_obj = json_decode($server_output);
    $server_output_obj->url = $api_url;
    $server_output_obj->token = $account_auth_token;
	$obj = json_encode($server_output_obj);
	
	print $obj;
	
}