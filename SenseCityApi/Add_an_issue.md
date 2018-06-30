# Add A new Report (issue)

First you add an anonymous issue

### Anonymous Issue

```
request({
            url: "https://api.sense.city/1.0/api/issue",
            method: "POST",
            json: { "loc": { "type": "Point", "coordinates": [Longitude, Latitude] }, "issue": "garbage", "device_id": "", "value_desc": "Χαλασμένος Κάδος", "comments": "comments", "image_name": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...", "mobile_num": "697xxxxxxx", "email_user": "user@user.com" }
        }, function (error, response, body) {
            //Add your code here
            //The requests return the objectID
            
    });
```
And then you add the verified user.

### Add a verified Issue
```
request({
            url: ghttps://api.sense.city/1.0/api/issue/objectID",
            method: "POST",
            json: { "name":"user", "email":"user@user.gr", "mobile_num":"697xxxxxxx" }
        }, function (error, response, body) {
            //Add your code here
        });
        
```

