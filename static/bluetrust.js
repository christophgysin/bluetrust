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

function bt_table_set(table, rows) {
    var html = '';

    for(var i=0; i<rows.length; ++i)
    {
        var row = rows[i];
        html += '<tr>'
        for(var j=0; j<row.length; ++j)
        {
            var field = row[j];
            html += '<td>' + field + '</td>';
        }
        html += '</tr>';
    }

    $('#' + table).find("tr:gt(0)").remove();
    $('#' + table + ' tr:last').after(html);
}

function bt_adapters_set(adapters) {
    var rows = [];

    for(path in adapters)
    {
        var adapter = adapters[path];
        var action = 'discover';

        var func = 'bt_adapter_action(' + "'" + path + "', '" + action + "');";
        var button = '<button onclick="' + func + '">' + action + '</button>';
        rows.push([path,
                   adapter.name,
                   adapter.address,
                   button]);
    }
    bt_table_set('adapters', rows);
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
    var rows = [];

    for(address in devices)
    {
        var device = devices[address];
        var action = device.Trusted ? 'untrust' : 'trust';

        var func = 'bt_device_action(' + "'" + address + "', '" + action + "');";
        var button = '<button onclick="' + func + '">' + action + '</button>';
        rows.push([device.name,
                   address,
                   device.RSSI,
                   button]);
    }
    bt_table_set('devices', rows);
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
