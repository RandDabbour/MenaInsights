import { listMessagesByRequestId } from "../repositories/messagesRepository.mjs";

export async function getMessagesForRequest(requestId) {
  return listMessagesByRequestId(requestId);
}
