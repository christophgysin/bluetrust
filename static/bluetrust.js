function bluetrust_init() {
    //var menuId = $("ul.nav").first().attr("id");
        //data: { id : menuId },
        //dataType: "html"

    var request;

    request = $.ajax({url: "/adapter"});
    request.done(bluetrust_adapters);
    request.fail(bluetrust_failed);

    request = $.ajax({url: "/device"});
    request.done(bluetrust_devices);
    request.fail(bluetrust_failed);
}

function bluetrust_failed(jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
}

function bluetrust_adapters(adapters) {
    var rows = '';

    for(path in adapters)
    {
        var adapter = adapters[path];
        var action = 'discover';

        rows +=
            '<tr>' +
                '<td>' + path + '</td>' +
                '<td>' + adapter.name + '</td>' +
                '<td>' + adapter.address + '</td>' +
                '<td>' +
                    '<button' +
                     ' name="' + action + '"' +
                     ' value="' + adapter.address + '"' +
                     ' type="submit"' +
                     '>' +
                        action +
                     '</button>' +
                '</td>' +
            '</tr>';
    }

    $('#adapters tr:last').after(rows);
}

function bluetrust_devices(devices) {
    var rows = '';

    for(address in devices)
    {
        var device = devices[address];
        console.log(device)
        var action = 'trust';

        rows +=
            '<tr>' +
                '<td>' + device.name + '</td>' +
                '<td>' + address + '</td>' +
                '<td>' + device.RSSI + '</td>' +
                '<td>' +
                    '<button' +
                     ' name="' + action + '"' +
                     ' value="' + address + '"' +
                     ' type="submit"' +
                     '>' +
                        action +
                     '</button>' +
                '</td>' +
            '</tr>';
    }
    console.log(rows)

    console.log($('#devices tr:last'))
    $('#devices tr:last').after(rows);
}
