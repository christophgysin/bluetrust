function bluetrust_init() {
    bluetrust_list('adapter');
    bluetrust_list('device');
}

function bluetrust_list(type) {
    var request = $.ajax({url: '/' + type});
    request.done(function(data){ bluetrust_set(type, data); });
    request.fail(bluetrust_failed);
}

function bluetrust_failed(jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
}

function bluetrust_set(type, data) {
    if (type == "adapter")
        bluetrust_adapters_set(data);
    else if (type == "device")
        bluetrust_devices_set(data);
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
                    '<button onclick="' +
                        'bluetrust_adapter_action(' +
                            "'" + path + "', '" + action + "');" +
                    '">' +
                        action +
                    '</button>' +
                '</td>' +
            '</tr>';
    }

    $("#adapters").find("tr:gt(0)").remove();
    $('#adapters tr:last').after(rows);
}

function bluetrust_adapter_action(adapter, action) {
    var request;
    request = $.ajax({
        url: "/adapter",
        method: "POST",
        data: {adapter: adapter,
               action: action},
    });
    request.done(bluetrust_list('adapter'));
    request.fail(bluetrust_failed);
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
    request.done(bluetrust_list('device'));
    request.fail(bluetrust_failed);
}
