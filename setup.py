#!/usr/bin/env python

from distutils.core import setup

setup(name='bluetrust',
      version='0',
      description='Webinterface to trust bluetooth devices',
      author='Christoph Gysin',
      author_email='christoph.gysin@gmail.com',
      url='https://github.com/christophgysin/bluetrust',
      license='GPLv2',
      scripts=['bluetrust.py'],
      requires=['dbus (>=1.2.0)',
                'gobject (>=2.28.3)',
                'twisted (>=13.2.0)'],
      data_files=[('share/bluetrust/static', ['static/index.html',
                                              'static/default.css',
                                              'static/bluetrust.js'])])
