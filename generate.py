#!/usr/bin/env python
import subprocess
import random
import time

out = open('/var/www/html/range/logs/taboot-special.html', 'w+')
out.write("<h1>Starting the random log generation</h1>")
out.flush()

while True:
    rand_sleep = random.randrange(7, 14)
    # rand_sleep = random.randrange(1, 2)
    print "Sleeping for... %d seconds" % rand_sleep
    time.sleep(rand_sleep)
    text = subprocess.check_output(['lorem-ipsum-generator', '-f', 'html-p', '-p', '2'])
    date = subprocess.check_output(['date'])
    out.write("<hr />")
    out.write("<h3>%s</h3>" % date);
    out.write(text)
    out.flush()
