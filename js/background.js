var queue = [];
var current;
var actions = {
	checkVotingState: checkVotingState,
	toggleVote:       toggleVote,
	countVotes:       countVotes,
};

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	// First, validate the message's structure
	if ((msg.from === 'content')) {
		if(actions[msg.subject] && typeof(actions[msg.subject]) == 'function') {
			return actions[msg.subject](msg.params);
		}
	}
});

function checkVotingState(params) {
	this.params = params;
	return new Promise((resolve, reject) => {
		$.ajax({
			url: 'https://bugzilla.mozilla.org/page.cgi', //page.cgi?id=voting/user.html&bug_id=1145899#vote_1145899
			data: {
				id: 'voting/user.html',
				bug_id: this.params.id
			}
		}).then(
			(data, status, xhr) => {
				$form   = $(data).find('form[name=voting_form]');
				$row    = $form.find('.bz_bug_being_voted_on');
				$issue  = $row.find(`input`);
				checked = $issue.is(':checked');
				quota   = $row.nextAll('tr').children('td[colspan=3]').first().text();
				resolve({
					$form:  $form,
					$issue: $issue,
					voted:  checked,
					quota:  quota,
					params: this.params
				});
			},
			(xhr, status, error) => {
				reject({
					xhr: xhr,
					status: status,
					error: error,
					params: this.params
				});
			}
		);
	});
}

function toggleVote(params) {
	this.params = params;
	return new Promise((resolve, reject) => {
		queue.push({
			params: this.params,
			resolve: resolve,
			reject: reject
		});
		tryQueue();
	});
}

function tryQueue() {
	if(current || !queue.length) {
		return;
	}
	current = queue.shift();
	$.extend(this, current);

	checkVotingState(this.params).then(
		(state) => {
			state.$issue.prop('checked', state.params.vote);
			$.ajax({
				url: `https://bugzilla.mozilla.org/page.cgi?id=voting/user.html&bug_id=${state.params.id}`,
				type: 'POST',
				data: state.$form.serialize()
			}).then(
				(data, status, xhr) => {
					$form   = $(data).find('form[name=voting_form]');
					$row    = $form.find('.bz_bug_being_voted_on');
					$issue  = $row.find(`input`);
					checked = $issue.is(':checked');
					quota   = $row.nextAll('tr').children('td[colspan=3]').first().text();
					message = $(data).find('.votes_change_saved').text();
					this.resolve({
						message: message,
						quota:   quota,
						voted:   checked
					});
					tryNext();
				},
				(xhr, status, error) => {
					this.reject({
						xhr: xhr,
						status: status,
						error: error
					});
					tryNext();
				}
			);
		},
		(reason) => {
			reason.params = this.params;
			this.reject(reason);
			tryNext();
		}
	);
}

function tryNext() {
	current = null;
	tryQueue();
}

function countVotes(id) {
	this.id = id;
	return new Promise((resolve, reject) => {
		$.ajax({
			url: 'https://bugzilla.mozilla.org/rest/bug',
			data: {
				id: this.id
			}
		}).then(
			(data) => {
				if(typeof(data.bugs[0].votes) !== 'undefined') {
					resolve(data.bugs[0].votes);
				} else {
					reject({});
				}
			},
			(xhr, status, error) => {
				reject({
					xhr: xhr,
					status: status,
					error: error
				});
			}
		);
	})
}

console.log("I'm alive in background!");
