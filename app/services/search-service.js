import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/Rx';

@Injectable()
export class SearchService {

    static get parameters() {
        return [Http];
    }

    constructor(http) {
        this.http = http;
    }

    findByImage(file, f) {
        var formData = new FormData();
        formData.append('image', file);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/search', true);
        xhr.addEventListener('load', function() {
            var json = JSON.parse(xhr.responseText);
            f(json);
        });
        xhr.send(formData);
    }

}
