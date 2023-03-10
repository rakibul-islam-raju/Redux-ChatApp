import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	conversationsApi,
	useAddConversationMutation,
	useEditConversationMutation,
} from "../../features/conversations/conversationsApi";
import { useGetUserQuery } from "../../features/users/UsersApi";
import Error from "../ui/Error";

export default function Modal({ open, control }) {
	const dispatch = useDispatch();

	const [to, setTo] = useState("");
	const [message, setMessage] = useState("");
	const [checkUser, setCheckUser] = useState(false);
	const [conversation, setConversation] = useState(undefined);
	const [responseError, setResponseError] = useState(null);

	const { user: loggedInUser } = useSelector((state) => state.auth) || {};
	const { email: myEmail } = loggedInUser || {};

	const {
		data: participant,
		isError,
		error,
	} = useGetUserQuery(to, {
		skip: !checkUser,
	});
	const [
		addConversation,
		{ isSuccess: addSuccess, isError: addIsError, error: addError },
	] = useAddConversationMutation();
	const [
		editConversation,
		{ isSuccess: editSuccess, isError: editIsError, error: editError },
	] = useEditConversationMutation();

	const debounceHandler = (fn, delay) => {
		let timeoutId;
		return (...args) => {
			clearTimeout(timeoutId);

			timeoutId = setTimeout(() => {
				fn(...args);
			}, delay);
		};
	};

	const doSearch = (value) => {
		setTo(value);
		setCheckUser(true);
	};

	const handleSearch = debounceHandler(doSearch, 1000);

	const handleSubmit = (e) => {
		e.preventDefault();

		if (conversation?.length > 0) {
			editConversation({
				id: conversation[0].id,
				data: {
					participants: `${myEmail}-${participant[0].email}`,
					users: [loggedInUser, participant[0]],
					message,
					timestamp: new Date().getTime(),
				},
				sender: myEmail,
			});
		} else if (conversation?.length === 0) {
			addConversation({
				sender: myEmail,
				data: {
					participants: `${myEmail}-${participant[0].email}`,
					users: [loggedInUser, participant[0]],
					message,
					timestamp: new Date().getTime(),
				},
			});
		}
	};

	useEffect(() => {
		if (participant?.length > 0 && participant[0]?.email !== myEmail) {
			// check conversation existance
			dispatch(
				conversationsApi.endpoints.getConversation.initiate({
					userEmail: myEmail,
					participantEmail: to,
				})
			)
				.unwrap()
				.then((data) => setConversation(data))
				.catch((err) => setResponseError("Something went wrong!"));
		}
	}, [participant, dispatch, myEmail, to]);

	return (
		open && (
			<>
				<div
					onClick={control}
					className="fixed w-full h-full inset-0 z-10 bg-black/50 cursor-pointer"
				></div>
				<div className="rounded w-[400px] lg:w-[600px] space-y-8 bg-white p-10 absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Send message
					</h2>
					<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
						<input type="hidden" name="remember" value="true" />
						<div className="rounded-md shadow-sm -space-y-px">
							<div>
								<label htmlFor="to" className="sr-only">
									To
								</label>
								<input
									id="to"
									name="to"
									type="email"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm"
									placeholder="Send to"
									onChange={(e) => handleSearch(e.target.value)}
								/>
							</div>
							<div>
								<label htmlFor="message" className="sr-only">
									Message
								</label>
								<textarea
									id="message"
									name="message"
									type="text"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm"
									placeholder="Message"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
								/>
							</div>
						</div>

						<div>
							<button
								type="submit"
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
								disabled={
									conversation === undefined ||
									(participant?.length > 0 && participant[0]?.email === myEmail)
								}
							>
								Send Message
							</button>
						</div>

						{participant?.length === 0 && (
							<Error message="This user does not exist!" />
						)}
						{participant?.length > 0 && participant[0]?.email === myEmail && (
							<Error message="You cannot send message to yourself!" />
						)}
						{isError && <Error message={error?.data} />}
						{responseError && <Error message={responseError} />}
					</form>
				</div>
			</>
		)
	);
}
