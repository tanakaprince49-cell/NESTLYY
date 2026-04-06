import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { showLocalNotification } from './pushService.ts';

/**
 * Get all members of a nest
 */
export async function getNestMembers(nestId: string): Promise<string[]> {
  try {
    const membershipsRef = collection(db, 'nests', nestId, 'memberships');
    const membershipsSnap = await getDocs(membershipsRef);

    return membershipsSnap.docs.map(doc => doc.data().userId);
  } catch (error) {
    console.error('Error getting nest members:', error);
    return [];
  }
}

/**
 * Send notifications to all nest members when a new post is created
 */
export async function notifyNestMembers(
  nestId: string,
  nestName: string,
  postAuthorUid: string,
  postAuthorName: string,
  postContent: string,
  postId: string
) {
  try {
    const members = await getNestMembers(nestId);

    // Don't notify the post author
    const membersToNotify = members.filter(memberId => memberId !== postAuthorUid);

    for (const memberId of membersToNotify) {
      // For now, we'll send notifications to all members
      // In a real app, you'd check each member's notification preferences
      await showLocalNotification(
        `New post in ${nestName}`,
        `${postAuthorName}: ${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}`,
        {
          tag: `nest-${nestId}-post-${postId}`,
          data: {
            type: 'nest_post',
            nestId,
            postId,
            authorName: postAuthorName
          }
        }
      );
    }
  } catch (error) {
    console.error('Error sending nest notifications:', error);
  }
}

