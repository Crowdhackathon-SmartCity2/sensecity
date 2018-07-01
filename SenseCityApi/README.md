
## SenseCity API

Sensecity is an **API** that collect problem issues from a city about the Plumbing, Lighting, Roads , Cleanliness and the mood for people that live there.

The purpose is to sent problems issues from people in real time through smart devices and other smart sensor.

The data that we collect, until now is the above problem issues, is open and everyone can get and processing them.

## Installing

Install dependencies
```
 npm install
```

## Configuring MongoDB

## Examples
[Add an issue.md](Add_an_issue.md)

## Default API Endpoint
### Get Method
```
API Endpoint : https://api.sense.city/api/1.0

Results: The first 1000 issues the last 3 days
```

## Default API Endpoint
### Get Method
```
/issue

Results: The first 1000 issues the last 3 days
```

## Variables:


| Variable | value | example | default value |
| --- | :-------------: | :---: | :---: |
| **startdate** | date time format  | YYYY-mm-DD <br>```2016-03-22```| today minus 3 days|
| **enddate** | date time format |  YYYY-mm-DD <br>```2016-03-22```  | today |
| **coordinates** | Latitude,Longitude | [Longitude,Latitude]<br>```[21.734574,38.2466395]``` |  with no specific coordinates |
| **issue** | garbage, plumbing, lighting, road-constructor, protection-policy, green, environment |  |  all issues |
| **limit** | Integer (5,10,20,30,100,...) <br>Returns records | 5<br>25 etc |  1000 |
| **sort** | Integer (1,-1)<br>*1:oldest to newest<br>*-1:newest to oldest  |  |  newest to oldest |
| **status** | CONFIRMED, IN_PROGRESS, RESOLVED  |  |  'CONFIRMED|IN_PROGRESS' |
| **includeAnonymous** | Integer (0,1)<br>*0:issue that is reported by verified users <br>*1:all issue(anonymous and verified users)  |  |  0 |
| **city** | string (0,1)<br>*city name  |  |  no default value |
| **departmants** | string <br>*with pipe(|) separate |  |  no deafault value |

## Examples

```

https://api.sense.city/api/1.0/issue?city=patras&enddate=2017-10-24&includeAnonymous=0&resolution=FIXED&startdate=2017-09-25&status=CONFIRMED|IN_PROGRESS&limit=20

Result : The last 20 garbage issues from 2016-03-22 to 2016-03-30 that reported in longtitude = 21.734574 and latitude = 38.2466395 and distance 15 km
```


## API Endpoint
### Post Method
```
/issue

Add a new issue report in sensecity platform
```

## Data

{"loc" : {
        "type" : "Point",  
        "coordinates" : ['+_lng+','+_lat+']
    },
    "issue" : "string",
    "device_id" : "string",
    "value_desc" : "string",
    "comments" : "text",
    "image_name" : "image base64",
    "mobile_num":"string",
    "email_user":"string"
}

## Example (jQuery)

...

    $.ajax({
            type: "POST",
            url: " https://api.sense.city/api/1.0/issue",
            data: '{"loc" : { "type" : "Point",  "coordinates" : [21.256995,38.256695] }, "issue" : "garbage","device_id" : "webapp", "value_desc" : "Damaged trunk","comments" : "any comment","image_name" : "data:image/jpeg;base64,/9j/4A.......","mobile_num":"697xxxxxxx", "email_user":"name@email.com" }',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                //YOUR CODE HERE
            }
        });

...

## Get Image from a bug_id
### Get Method
```
/image_issue

Results: Return the image file
```

| Variable | value | example | default value |
| ------------ | :-------------: | :---: | :---: |
| **bug_id** | integer  | XXXX <br>```3965```| no default value |
| **resolution** | string |  full, medium, small  | no default value |

##Examples

```

https://api.sense.city/api/1.0/image_issue?bug_id=4488&resolution=small

Result : Return the small image from the issue with bud id '4488'
```

## Example (jQuery)
```
$.ajax({
		crossDomain: true,
		type:"GET",
		url: "https://api.sense.city/api/1.0/image_issue?bug_id=4488&resolution=small",
		contentType: "application/json; charset=utf-8",                                				
		success: function(msg){
            //YOUR CODE HERE
        }
});


```
## License
Copyright 2018 SenseCity

This project is licensed under the Apache License, Version 2.0.
You may obtain a copy of the License [here](http://www.apache.org/licenses/LICENSE-2.0)
