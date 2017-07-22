$(function() {
	console.log($('#bugzilla-global').data('bugzilla'));
	var bug_id = $('#bug_id').val();
	var quota, message;
	// BUGZILLA = $.parseJSON($('#bugzilla-global').data('bugzilla'));
	$parent = $('#vote-btn').parent();
	$('#vote-btn').remove();
	$parent.append(
		$('<button>', {
			id:    'vote-toggle',
			class: 'minor',
			type:  'button',
			text:  'Vote'
		}).click(function(e) {
			e.preventDefault();
			$.ajax({
				url: 'https://bugzilla.mozilla.org/page.cgi', //page.cgi?id=voting/user.html&bug_id=1145899#vote_1145899
				data: {
					id: 'voting/user.html',
					bug_id: bug_id
				}
			})
			.done(function(voting) {
				console.log("success");
				console.log(voting);
				var $form  = $(voting).find('form[name=voting_form]');
				var $issue = $form.find(`input[name=${bug_id}]`);
				$issue.prop('checked', !$issue.is(':checked'));
				console.log($form.serialize());
				$.ajax({
					// url: '/path/to/file',
					type: 'POST',
					$form.serialize(),
				})
				.done(function(voting) {
					console.log("success");
					$form   = $(voting).find('form[name=voting_form]');
					quota   = $form.find('.bz_bug_being_voted_on').nextAll('tr').children('td[colspan=3]').first().text();
					message = $(voting).find('.votes_change_saved').text();
				})
				.fail(function() {
					console.log("error");
				})
				.always(function() {
					console.log("complete");
				});

			})
			.fail(function() {
				console.log("error");
			})
			.always(function(a, b, c) {
				console.log("complete");
				console.log([a,b,c]);
			});

		})
	);
});
