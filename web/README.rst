Insallation
===========

Create a virtualenv::

    $ virtualenv venv
    $ . venv/bin/activate
    $ pip install -r requirements.txt

Install dependencies not covered by pip::

    $ sudo apt-get install python-imaging python-redis

Start server::

    $ cd server/
    $ python server.py
