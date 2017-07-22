$(function() {
	console.log($('#bugzilla-global').data('bugzilla'));
	var bug_id = $('#bug_id').val();
	var quota, message;
	// BUGZILLA = $.parseJSON($('#bugzilla-global').data('bugzilla'));
	$parent = $('#vote-btn').parent();
	$parent.empty();

	var $votes   = $('<span>', {class: 'votes'});
	var $message = $('<span>', {class: 'message'});
	var $quota   = $('<span>', {class: 'quota'});

	var $button = $('<button>', {
		id:       'vote-toggle',
		class:    'minor initializing',
		type:     'button',
		disabled: 'disabled'
	}).data('state', 'initializing')
		.append($('<span>', {
			class: 'initializing-text',
			text:  'Initializing voting...'
		}))
		.append($('<span>', {
			class: 'voting-text',
			text:  'Submitting vote...'
			"exceeded "
		}))
		.append($('<span>', {
			class: 'vote-text',
			text:  'Vote'
		}))
		.append($('<span>', {
			class: 'remove-vote-text',
			text:  'Remove vote'
		}))
		.click((e) => {
			e.preventDefault();
			$message.text('');
			foo = {
				initializing: () => {},
				voting: () => {},
				vote: () => {
					browser.runtime.sendMessage({
						from:    'content',
						subject: 'toggleVote',
						params: {
							id:   bug_id,
							vote: $button.hasClass('vote')
						}
					}).then(
						(status) => {
							console.log(status);
							updateCounter(bug_id);
							state = (status.voted) ? 'remove-vote' : 'vote';
							$button
								.prop('disabled', false)
								.data('state', 'vote')
								.attr('class', 'minor')
								.addClass(state);
							$message.text(status.message);
							$quota.text(status.quota);
						},
						(reason) => {
							console.log(reason);
						}
					);
					$button
						.prop('disabled', true)
						.data('state', 'voting')
						.attr('class', 'minor voting');
				}
			}[$button.data('state')]();
		});

	$parent.append([$votes, $button, $message, $quota, $(`
<style>
		#vote-toggle span {
			display: none;
		}
		#vote-toggle.initializing .initializing-text,
		#vote-toggle.vote .vote-text,
		#vote-toggle.remove-vote .remove-vote-text,
		#vote-toggle.voting .voting-text {
			display: inline;
		}

		#vote-toggle .initializing-text::before,
		#vote-toggle .voting-text::before {
			content: url("https://bugzilla.mozilla.org/extensions/BugModal/web/throbber.gif");
		}
</style>
		`)]);

	browser.runtime.sendMessage({
		from:    'content',
		subject: 'checkVotingState',
		params: {
			id: bug_id
		}
	}).then(
		(status) => {
			console.log(status);
			updateCounter(bug_id);
			state = (status.voted) ? 'remove-vote' : 'vote';
			$button
				.prop('disabled', false)
				.data('state', 'vote')
				.attr('class', 'minor')
				.addClass(state);
			$quota.text(status.quota);
		},
		(reason) => {
			console.log(reason);
		}
	);

	function updateCounter(id) {
		browser.runtime.sendMessage({
			from:    'content',
			subject: 'countVotes',
			params:  id
		}).then(
			(votes) => {
				this.votes = votes;
				$votes.text(() => {
					votes = this.votes;
					if(votes > 1) {
						return `${votes} votes`;
					}
					if(votes == 1) {
						return `${votes} vote`;
					}
					return 'No votes';
				});
			},
			(reason) => {
				console.log(reason);
			}
		);
	}
});
