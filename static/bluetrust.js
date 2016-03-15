function bluetrust_init() {
    bluetrust_adapters_list();
    bluetrust_devices_list();
}

function bluetrust_adapters_list() {
    var request = $.ajax({url: "/adapter"});
    request.done(bluetrust_adapters_set);
    request.fail(bluetrust_failed);
}

function bluetrust_devices_list() {
    var request = $.ajax({url: "/device"});
    request.done(bluetrust_devices_set);
    request.fail(bluetrust_failed);
}

function bluetrust_failed(jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
}

function bluetrust_adapters_set(adapters) {
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

    $("#adapters").find("tr:gt(0)").remove();
    $('#adapters tr:last').after(rows);
}


function bluetrust_devices_set(devices) {
    var rows = '';

    for(address in devices)
    {
        var device = devices[address];
        var action = device.trusted ? 'untrust' : 'trust';

        rows +=
            '<tr>' +
                '<td>' + device.name + '</td>' +
                '<td>' + address + '</td>' +
                '<td>' + device.RSSI + '</td>' +
                '<td>' +
                    '<button onclick="' +
                        'bluetrust_device_action(' +
                            "'" + address + "', '" + action + "');" +
                    '">' +
                        action +
                    '</button>' +
                '</td>' +
            '</tr>';
    }

    $("#devices").find("tr:gt(0)").remove();
    $('#devices tr:last').after(rows);
}

function bluetrust_device_action(address, action) {
    var request;
    request = $.ajax({
        url: "/device",
        method: "POST",
        data: {address: address,
               action: action},
    });
    request.done(bluetrust_devices_list);
    request.fail(bluetrust_failed);
}
