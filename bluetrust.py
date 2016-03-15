#!/usr/bin/env python

from __future__ import print_function

import dbus
import dbus.mainloop.glib
try:
    from gi.repository import GObject
except ImportError:
    import gobject as GObject
try:
    from twisted.internet import gireactor
    gireactor.install()
except ImportError:
    from twisted.internet import glib2reactor
    glib2reactor.install()
from twisted.web import server, static, resource
from twisted.application.strports import service

import logging
from twisted.python import log

import json

_adapters = {}
_devices = {}


class BtAdapter(resource.Resource):
    isLeaf = True

    def render_GET(self, request):
        request.setHeader(b'Content-Type', b'application/json')
        return json.dumps(_adapters).encode('utf-8')

    def render_POST(self, request):
        adapter = request.args[b'adapter'][0].decode('utf-8')
        action = request.args[b'action'][0].decode('utf-8')

        if action == "discover":
            start_discovery(adapter)

        return self.render_GET(request)


class BtDevice(resource.Resource):
    isLeaf = True

    def render_GET(self, request):
        request.setHeader(b'Content-Type', b'application/json')
        return json.dumps(_devices).encode('utf-8')

    def render_POST(self, request):
        address = request.args[b'address'][0].decode('utf-8')
        action = request.args[b'action'][0].decode('utf-8')

        if action == "trust":
            device_trust(address)
        elif action == "untrust":
            device_untrust(address)

        return self.render_GET(request)


def init_logging():
    logging.basicConfig(level=logging.WARNING)

    observer = log.PythonLoggingObserver(loggerName='logname')
    observer.start()


def init_webserver():
    root = static.File("static")
    root.putChild(b"adapter", BtAdapter())
    root.putChild(b"device", BtDevice())

    factory = server.Site(root)

    s = None
    try:
        s = service('systemd:domain=INET:index=0', factory)
    except:
        pass

    if s is None:
        s = service('tcp:8080', factory)

    s.startService()


def dbus2py(obj):
    if isinstance(obj, dbus.Array):
        return [dbus2py(e) for e in obj]
    if isinstance(obj, dbus.Dictionary):
        return {(k, dbus2py(v)) for k, v in obj.items()}
    if isinstance(obj, dbus.String):
        return str(obj)
    if isinstance(obj, dbus.ObjectPath):
        return str(obj)
    if isinstance(obj, dbus.Boolean):
        return bool(obj)
    if isinstance(obj, dbus.Int16):
        return int(obj)
    if isinstance(obj, dbus.Int32):
        return int(obj)
    if isinstance(obj, dbus.Int64):
        return int(obj)
    return obj


def device_trust(address):
    _devices[address]['Trusted'] = True

    for adapter in _adapters:
        path = '{}/dev_{}'.format(adapter,
                                  address.replace(':', '_'))
        try:
            obj = bus.get_object('org.bluez', path)
            props_iface = dbus.Interface(obj, 'org.freedesktop.DBus.Properties')
            props_iface.Set('org.bluez.Device1', 'Trusted', dbus.Boolean(True))
        except:
            pass


def device_untrust(address):
    _devices[address]['Trusted'] = False

    for adapter in _adapters:
        path = '{}/dev_{}'.format(adapter,
                                  address.replace(':', '_'))
        try:
            obj = bus.get_object('org.bluez', path)
            props_iface = dbus.Interface(obj, 'org.freedesktop.DBus.Properties')
            props_iface.Set('org.bluez.Device1', 'Trusted', dbus.Boolean(False))
        except:
            pass


def split_device_path(path):
    adapter, device = path.rsplit('/', 1)
    address = ':'.join(device.split('_')[1:])
    return adapter, address


def device_changed(iface, changed, invalidated, path=None):
    adapter, address = split_device_path(path)
    print('device: ' + address, end='')
    for name, value in changed.items():
        name = dbus2py(name)
        value = dbus2py(value)
        _devices[address][name] = value
        print(" {}: {}".format(name, value), end='')
    print()


def device_added(path):
    obj = bus.get_object('org.bluez', path)
    props_iface = dbus.Interface(obj, 'org.freedesktop.DBus.Properties')
    props_iface.connect_to_signal('PropertiesChanged', device_changed, path_keyword='path')

    props = props_iface.GetAll('org.bluez.Device1')

    adapter = dbus2py(props['Adapter'])
    address = dbus2py(props['Address'])
    name = dbus2py(props.get('Name', ''))
    rssi = dbus2py(props.get('RSSI', ''))
    trusted = dbus2py(props.get('Trusted'))

    print('device: {} {} {} {}'.format(adapter, address, name, rssi))

    _devices[address] = {'name': name,
                         'adapter': adapter,
                         'RSSI': rssi,
                         'Trusted': trusted}



def device_removed(path):
    adapter, device = split_device_path(dbus2py(path))
    del(_devices[device])


def iface_added(path, objects):
    if 'org.bluez.Adapter1' in objects:
        adapter_added(path)
    if 'org.bluez.Device1' in objects:
        device_added(path)


def iface_removed(path, objects):
    if 'org.bluez.Adapter1' in objects:
        adapter_removed(path)
    if 'org.bluez.Device1' in objects:
        device_removed(path)


def adapter_added(path):
    obj = bus.get_object('org.bluez', path)
    props_iface = dbus.Interface(obj, 'org.freedesktop.DBus.Properties')
    props = props_iface.GetAll('org.bluez.Adapter1')

    address = dbus2py(props['Address'])
    name = dbus2py(props.get('Name', ''))

    print('adapter: {} {} {}'.format(path, address, name))
    _adapters[path] = {'name': name, 'address': address}

    props_iface.Set('org.bluez.Adapter1', 'Discoverable', dbus.Boolean(True))


def adapter_removed(path):
    path = dbus2py(path)
    del(_adapters[path])


def start_discovery(path):
    print(path + ": Starting discovery")
    adapter = dbus.Interface(bus.get_object('org.bluez', path), 'org.bluez.Adapter1')
    try:
        adapter.StartDiscovery()
    except dbus.exceptions.DBusException:
        pass


def connect_to_bluez():
    root = bus.get_object('org.bluez', '/')
    objmanager = dbus.Interface(root, 'org.freedesktop.DBus.ObjectManager')
    objects = objmanager.GetManagedObjects()

    objmanager.connect_to_signal('InterfacesAdded', iface_added)
    objmanager.connect_to_signal('InterfacesRemoved', iface_removed)

    for path, interfaces in objects.items():
        if 'org.bluez.Adapter1' in interfaces:
            adapter_added(path)
        if 'org.bluez.Device1' in interfaces:
            device_added(path)


if __name__ == '__main__':
    init_logging()

    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()

    connect_to_bluez()
    init_webserver()

    mainloop = GObject.MainLoop()
    mainloop.run()
