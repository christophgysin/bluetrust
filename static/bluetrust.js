function bt_init() {
    bt_list('adapter');
    bt_list('device');
}

function bt_list(type) {
    var request = $.ajax({url: '/' + type});
    request.done(function(data){ bt_set(type, data); });
    request.fail(bt_failed);
}

function bt_failed(jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
}

function bt_set(type, data) {
    if (type == "adapter")
        bt_adapters_set(data);
    else if (type == "device")
        bt_devices_set(data);
}

function bt_adapters_set(adapters) {
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
                        'bt_adapter_action(' +
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

function bt_adapter_action(adapter, action) {
    var request;
    request = $.ajax({
        url: "/adapter",
        method: "POST",
        data: {adapter: adapter,
               action: action},
    });
    request.done(function(data){ bt_set('adapter', data); });
    request.fail(bt_failed);
}

function bt_devices_set(devices) {
    var rows = '';

    for(address in devices)
    {
        var device = devices[address];
        var action = device.Trusted ? 'untrust' : 'trust';

        rows +=
            '<tr>' +
                '<td>' + device.name + '</td>' +
                '<td>' + address + '</td>' +
                '<td>' + device.RSSI + '</td>' +
                '<td>' +
                    '<button onclick="' +
                        'bt_device_action(' +
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

function bt_device_action(address, action) {
    var request;
    request = $.ajax({
        url: "/device",
        method: "POST",
        data: {address: address,
               action: action},
    });
    request.done(function(data){ bt_set('device', data); });
    request.fail(bt_failed);
}
