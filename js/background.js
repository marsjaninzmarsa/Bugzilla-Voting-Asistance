var queue = [];
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

		checkVotingState(this.params).then(
			(state) => {
				console.log(state);
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
						console.log([
							$form,
							$row,
							$issue,
							checked,
							quota,
							message,
							data,
							status,
							xhr
						]);
						resolve({
							message: message,
							quota:   quota,
							voted:   checked
						});
					},
					(xhr, status, error) => {
						reject({
							xhr: xhr,
							status: status,
							error: error
						});
					}
				);
			},
			(reason) => {
				reason.params = this.params;
				reject(reason);
			}
		);
	});
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
