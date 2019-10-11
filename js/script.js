$(document).ready(function () {

    var wrapperDragBlock = $('.wrapperDragBlock'),
        mapProgressBar = new Map();

    function addProgressBar() {
        $('.heder-progress').remove();

        mapArrayFiles.forEach(function (file, name) {
            var progress = '<div class="heder-progress" data-name-file="' + name + '">' + name + '<div class="my-progress-bar"><div class="percent">0%</div></div></div>';
            wrapperDragBlock.append(progress);
        });
        updateProgressBars();
    }

    var drag = $('.dragBlock');

    drag.on("dragleave", function (e) {
        stopProp(e);
        $(this).removeClass('hover');
        return false;
    });

    drag.on('dragover', function (e) {
        stopProp(e);
        $(this).removeClass('drop').addClass('hover');
    });


    drag.on("drop", function (e) {
        stopProp(e);
        var files = e.originalEvent.dataTransfer.files;
        getObjectWithSettings(files);
        $(this).removeClass('hover').addClass('drop');
        return false;
    });


    $('input[type=file]').on('change', function (e) {
        stopProp(e);
        var files = this.files;
        getObjectWithSettings(files);
    });

    function stopProp(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    var arrru = ['Я', 'я', 'Ю', 'ю', 'Ч', 'ч', 'Ш', 'ш', 'Щ', 'щ', 'Ж', 'ж', 'А', 'а', 'Б', 'б', 'В', 'в', 'Г', 'г', 'Д', 'д', 'Е', 'е', 'Ё', 'ё', 'З', 'з', 'И', 'и', 'І', 'і', 'Й', 'й', 'Ї', 'ї', 'К', 'к', 'Л', 'л', 'М', 'м', 'Н', 'н', 'О', 'о', 'П', 'п', 'Р', 'р', 'С', 'с', 'Т', 'т', 'У', 'у', 'Ф', 'ф', 'Х', 'х', 'Ц', 'ц', 'Ы', 'ы', 'Ь', 'ь', 'Ъ', 'ъ', 'Э', 'э', '&', ',', 'ê'];

    var arren = ['Ya', 'ya', 'Yu', 'yu', 'Ch', 'ch', 'Sh', 'sh', 'Sh', 'sh', 'Zh', 'zh', 'A', 'a', 'B', 'b', 'V', 'v', 'G', 'g', 'D', 'd', 'E', 'e', 'E', 'e', 'Z', 'z', 'I', 'i', 'I', 'i', 'J', 'j', 'J', 'j', 'K', 'k', 'L', 'l', 'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'R', 'r', 'S', 's', 'T', 't', 'U', 'u', 'F', 'f', 'H', 'h', 'C', 'c', 'Y', 'y', '-', '-', '\'', '\'', 'E', 'e', '-', '.', 'e'];

    function cyrillToLatin(text) {
        for (var i = 0; i < arrru.length; i++) {
            var reg = new RegExp(arrru[i], "g");
            text = text.replace(reg, arren[i]).replace(" ", '-');
        }
        return text;
    }

    var mapArrayFiles = new Map();

    var bigFile = 40 * (1024 * 1024),
        bigFileGB_1 = 1024 * (1024 * 1024),
        bigFileGB_2 = 1024 * (1024 * 1024) * 2,
        url = "https://cors-anywhere.herokuapp.com/",
        urlHome = "http://g50137h9.beget.tech/php/index.php";

    function getObjectWithSettings(files) {

        var data = new FormData();

        $.each(files, function (i, val) {
            var name = cyrillToLatin(val.name);
            mapArrayFiles.set(name, i);

            var fileOpt = [name, val.type, val.size];
            data.append('file-opt', fileOpt);

            $.ajax({
                url: urlHome,
                contentType: false,
                processData: false,
                data: data,
                type: 'POST',
                success: function (res, statys, obj) {

                    if (val.size < bigFile) {
                        sendFile(val, JSON.parse(res));
                        addProgressBar();
                        console.log('small');

                    } else {

                        addFilesArray(val, JSON.parse(res), name);
                        console.log('big');
                        addProgressBar();

                    }

                },
                error: function (res, statys, obj) {
                    getObjectWithSettings(files);
                    console.log(res);
                }
            });
        });
    }
   

    function sendFile(file, token) {
        
        var name = cyrillToLatin(file.name);

        $.ajax({
            url: url + token.uploadUrl,
            type: 'POST',
            contentType: false,
            processData: false,
            data: file,
            headers: {
                "Authorization": token.authorizationToken,
                "X-Bz-File-Name": name,
                "Content-Type": "b2/x-auto",
                "X-Bz-Info-Author": "unknown",
                "X-Bz-Content-Sha1": 'do_not_verify',
                "corsRuleName": "downloadFromAnyOrigin",
                "allowedOrigins": "*",
                "allowedHeaders": ["X-Bz-File-Name", "Authorization"],
                "allowedOperations": [
							"b2_upload_file"
						  ],
                "exposeHeaders": ["x-bz-content-sha1"],
                "maxAgeSeconds": 3600
            },
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.addEventListener('progress', function (e) {
                        if (e.lengthComputable) {

                            mapProgressBar.set(name, Math.ceil(e.loaded / e.total * 100));
                            updateProgressBars();

                        }
                    }, false),
                    xhr.upload.addEventListener('load', function () {
                        removeProgressBar(name);
                    });
                return xhr;
            },
            success: function (res, statys, obj) {
                saveSuccessfulUploadData(res);
            },
            error: function (res, statys, obj) {
                sendFile(file, token, name);
                console.log(res);
            }
        });
    }

    function getSizeSlice(size) {
        if (size < bigFileGB_2) {
            return 30 * (1024 * 1024);
        } else {
            return size / 50;
        }
    }

    var mapArraySliceFile = new Map();

    var arrFiles = [],
        flag = true;

    function addFilesArray(file, dataSetting, name) {
        var obj = {};
        obj.file = file;
        obj.name = name;
        obj.startSetting = dataSetting;
        arrFiles.push(obj);
        formQueue();
    }

    var a = 0;

    function formQueue() {

        if (flag && a != arrFiles.length) {

            splitBigFile(arrFiles[a].file, arrFiles[a].startSetting, arrFiles[a].name);
            flag = false;
            arrFiles[a] = 1;
            a++

        }
    }


    function splitBigFile(file, startSetting, name) {

        var minimumParSize = getSizeSlice(file.size),
            data = 0,
            pos = 0;

        mapArraySliceFile.set(name, new Array);

        while (pos < file.size) {

            data = file.slice(pos, pos + minimumParSize);
            if (data.size == 0) break;
            mapArraySliceFile.get(name).push(data);
            pos += minimumParSize;

        }

        uploadPartOfFile(name, startSetting);

    }

    var mapIdFile = new Map(),
        mapFiles = new Map(),
        mapUrl = new Map(),
        mapIndexSlice = new Map();

    function uploadPartOfFile(name, startSetting) {

        var arrayLength = mapArraySliceFile.get(name).length,
            data = new FormData();

        mapUrl.set(name, new Array);
        mapIndexSlice.set(name, new Array);

        data.append('upload_part_of_file',
            startSetting.fileId);
        mapProgressBar.set(name, 1);


        $.each(mapArraySliceFile.get(name), function (i, slice) {
            mapIndexSlice.get(name).push(i);
            $.ajax({
                url: urlHome,
                contentType: false,
                processData: false,
                data: data,
                type: 'POST',
                success: function (res, statys, obj) {
                    createArrayTokens(JSON.parse(res), name, arrayLength, startSetting);
                },
                error: function (res, statys, obj) {
                    uploadPartOfFile(name, startSetting);
                    console.log(res);
                }
            });
        });

    }


    function createArrayTokens(object, name, arrayLength, startSetting) {

        mapUrl.get(name).push(object);

        if (arrayLength == mapUrl.get(name).length) {

            mapIdFile.set(mapUrl.get(name)[0].fileId, name);
            mapFiles.set(name, new Array);
            console.log(mapUrl.get(name));
            prepareBigFileForSending(name);

        }
    }

    var indexSlice = 0;

    function prepareBigFileForSending(name) {

        while (indexSlice < 15 && mapIndexSlice.get(name).length > 0) {
            var index = mapIndexSlice.get(name).shift();
            sendBigFileServe(index, name);
            indexSlice++
        }

    }


    function sendBigFileServe(index, name) {

        $.ajax({
            url: url + mapUrl.get(name)[index].uploadUrl,
            contentType: false,
            processData: false,
            data: mapArraySliceFile.get(name)[index],
            type: 'POST',
            headers: {
                "Accept": "application/json",
                "Authorization": mapUrl.get(name)[index].authorizationToken,
                "X-Bz-Part-Number": index + 1,
                "X-Bz-Content-Sha1": 'do_not_verify',
                "corsRuleName": "downloadFromAnyOrigin",
                "allowedOrigins": "*",
                "allowedHeaders": ["Authorization"],
                "allowedOperations": [
							"b2_upload_part",
							"b2_upload_file"
						  ],
                "exposeHeaders": ["x-bz-content-sha1"],
                "maxAgeSeconds": 3600
            },
            success: function (data, statys, obj) {
                mapArraySliceFile.get(name)[data.partNumber - 1] = 1;
                mapFiles.get(mapIdFile.get(data.fileId)).push(data);
                var files = mapFiles.get(mapIdFile.get(data.fileId)).length;
                var slice = mapArraySliceFile.get(name).length;
                var result = Math.round(100 / slice * files);

                if (files == slice) {
                    finishLargeFile(name);
                    flag = true;
                    indexSlice = 0;
                    formQueue();
                } else {
                    indexSlice--;
                    prepareBigFileForSending(name);
                }

                mapProgressBar.set(name, result);
                updateProgressBars();
            },
            error: function (res, statys, obj) {
                sendBigFileServe(index, name);
                console.log(res);
            }
        });

    }


    var arr = [];

    function finishLargeFile(name) {

        var data = mapFiles.get(name);

        for (var i = 0; i < data.sort(function (obj1, obj2) {
                return obj1.partNumber - obj2.partNumber;
            }).length; i++) {
            var strSplit = data[i].contentSha1.split(':');
            arr.push(strSplit[1]);
        }

        var obj = {
            'fileId': mapUrl.get(name)[0].fileId,
            'partSha1Array': arr
        };

        $.ajax({
            url: url + mapUrl.get(name)[0].url + "/b2api/v2/b2_finish_large_file",
            contentType: false,
            processData: false,
            data: JSON.stringify(obj),
            type: 'POST',
            headers: {
                "Accept": "application/json",
                "Authorization": mapUrl.get(name)[0].token
            },
            success: function (res, statys, obj) {
                saveSuccessfulUploadData (res);
                removeProgressBar(cyrillToLatin(res.fileName));
                arr = [];
            },
            error: function (res, statys, obj) {
                finishLargeFile(name);
                console.log(res);
                arr = [];
            }
        });
    }


    function updateProgressBars() {

        mapProgressBar.forEach(function (percent, id) {
            $('.heder-progress[data-name-file="' + id + '"]').children().children().text(percent + '%').css('width', percent + '%');
        });
    }

    function removeProgressBar(name) {

        $('.heder-progress[data-name-file="' + name + '"]').remove();
        mapArrayFiles.delete(name);
        mapProgressBar.delete(name);
        mapArraySliceFile.delete(name);
        mapFiles.delete(name);
        mapIndexSlice.delete(name);
        mapUrl.delete(name);

    }
    
    function saveSuccessfulUploadData(data) {
        
        console.log(data);
        var  data_success = new FormData();
        data_success.append("data_success_file", JSON.stringify(data));
        
        $.ajax({
            url: urlHome,
            contentType: false,
            processData: false,
            data: data_success,
            type: 'POST',
            success: function (res, statys, obj) {
                console.log(res);
            },
            error: function (res, statys, obj) {
                console.log(res);
            }
        });
    }

});