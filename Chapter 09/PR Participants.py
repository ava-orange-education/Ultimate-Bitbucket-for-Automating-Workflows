import requests
from requests.auth import HTTPBasicAuth
import csv
from ndicts import NestedDict

try:
    import env
    username = env.username
    password = env.app_password
    repository = env.repository_slug

except [ImportError, AttributeError]:
    print('Could not locate one or more attributes within the "env.py" file. '
          'Please follow the readme to ensure that all attributes are present and try again.')
    exit()

def getPullRequestslist():
    pr_list = []
    next_page_url = 'https://api.bitbucket.org/2.0/repositories/%s/pullrequests?fields=next,values.id&&state=MERGED&&state=OPEN&&state=DECLINED' % repository

    # Keep fetching pages while there's a page to fetch
    while next_page_url is not None:
        response = requests.get(next_page_url, auth=HTTPBasicAuth(username, password))
        page_json = response.json()

        # Parse repositories from the JSON
        for repo in page_json['values']:
            PR_ID = str(repo['id'])
            pr_list.append(PR_ID)
        next_page_url = page_json.get('next', None)

    return pr_list

def getPullRequestStats(pr_list):
    with open("pr-stats.csv", "w") as file:
        writer = csv.writer(file)
        writer.writerow(["PR Number", "PR Author", "PR Title", "Participants - Reviewers"])
        for pr_id in pr_list:
            next_page_url = 'https://api.bitbucket.org/2.0/repositories/%s/pullrequests/%s?fields=next,id,author.display_name,rendered.title.raw,participants.user.display_name' % (repository, pr_id)
            # Keep fetching pages while there's a page to fetch
            while next_page_url is not None:
                response = requests.get(next_page_url, auth=HTTPBasicAuth(username, password))
                page_json = response.json()
                nd = NestedDict(page_json) #nested dictionaries
                PR_ID = str(nd['id'])
                PR_Author = nd['author']['display_name']
                PR_Title = nd['rendered']['title']['raw']
                list = []  #participants is a list nested with dictionaries
                for participant in page_json["participants"]:
                    print(participant)
                    PR1 = participant['user']['display_name']
                    list.append(PR1) #append to empty list
                Participant_reviewers = ", ".join(list) #will join a list of strings into a string with ", " as delimiters
                writer.writerow([PR_ID, PR_Author, PR_Title, Participant_reviewers])
                next_page_url = page_json.get('next', None)

def main():
    pr_list = getPullRequestslist()
    getPullRequestStats(pr_list)

if __name__ == '__main__':
    main()
