# import sys
from docker import Client
# from lib.python import es_logging as log
# logger = log.my_logger(__name__)


def install_update_db():
    c = Client(base_url='unix://var/run/docker.sock')
    command = ["/setup_estationdb.sh"]
    commandid = c.exec_create('postgres', command)
    response = c.exec_start(commandid)
    return response
    # logger.info("install_update_db:\n %s" % status)


if __name__ == "__main__":

    # me, DBVERSION = sys.argv

    try:
        status = install_update_db()
        print(status)
    except Exception as e:
        print('Error in call to the setup_estationdb.sh script in the postgres container!')
        print(e)
