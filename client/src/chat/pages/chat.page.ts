import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Chat, Message } from '../../core/models';
import { ChatService } from '../services/chat.service';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'jc-chat-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="jc-container grid gap-4 py-8 lg:grid-cols-[320px_1fr]">
      <aside class="jc-panel overflow-hidden">
        <div class="border-b border-[var(--jc-line)] p-4">
          <h1 class="text-xl font-semibold">Chat</h1>
          <p class="mt-1 text-xs text-[var(--jc-muted)]">{{ socket.connected() ? 'Online' : 'Connecting' }}</p>
        </div>
        <div class="max-h-[70vh] overflow-auto">
          @for (chat of chats(); track chat._id) {
            <button
              type="button"
              class="block w-full border-b border-[var(--jc-line)] px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              [class.bg-teal-50]="selectedChatId() === chat._id"
              (click)="selectChat(chat._id)"
            >
              <span class="font-medium">Conversation</span>
              <span class="mt-1 block text-xs text-[var(--jc-muted)]">{{ chat.updatedAt || chat.createdAt || '' }}</span>
            </button>
          } @empty {
            <p class="p-4 text-sm text-[var(--jc-muted)]">No conversations yet.</p>
          }
        </div>
      </aside>

      <section class="jc-panel flex min-h-[70vh] flex-col overflow-hidden">
        <div class="border-b border-[var(--jc-line)] p-4">
          <h2 class="font-semibold">{{ selectedChatId() ? 'Messages' : 'Select a conversation' }}</h2>
          @if (typing()) {
            <p class="text-xs text-teal-700">{{ typing() }}</p>
          }
        </div>
        <div class="flex-1 space-y-3 overflow-auto p-4">
          @for (message of messages(); track message._id) {
            <article class="max-w-[80%] rounded border border-[var(--jc-line)] bg-[var(--jc-bg)] p-3 text-sm">
              <p>{{ message.text || 'Attachment' }}</p>
              @if (message.attachment) {
                <a class="mt-2 inline-flex text-teal-700" [href]="chatService.downloadUrl(message._id)" target="_blank" rel="noreferrer">Download</a>
              }
            </article>
          }
        </div>
        <form class="flex gap-2 border-t border-[var(--jc-line)] p-4" (ngSubmit)="send()">
          <input
            class="jc-focus-ring min-w-0 flex-1 rounded border border-[var(--jc-line)] bg-transparent px-3 py-2 text-sm"
            name="message"
            [(ngModel)]="draft"
            [disabled]="!selectedChatId()"
            (input)="notifyTyping()"
          />
          <input class="hidden" type="file" #fileInput (change)="upload($event)" />
          <button type="button" class="rounded border border-[var(--jc-line)] px-3 py-2 text-sm" [disabled]="!selectedChatId()" (click)="fileInput.click()">Upload</button>
          <button class="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white" [disabled]="!selectedChatId()">Send</button>
        </form>
      </section>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPageComponent implements OnInit, OnDestroy {
  readonly chatService = inject(ChatService);
  readonly socket = inject(SocketService);
  private readonly destroy$ = new Subject<void>();

  readonly chats = signal<Chat[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly selectedChatId = signal<string | null>(null);
  readonly typing = signal<string | null>(null);
  draft = '';

  ngOnInit(): void {
    this.loadChats();
    this.socket.connect();
    this.socket.onMessage().pipe(takeUntil(this.destroy$)).subscribe((message) => {
      if (message.chatId === this.selectedChatId()) {
        this.messages.update((messages) => [...messages, message]);
      }
    });
    this.socket.onTyping().pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event.chatId === this.selectedChatId()) {
        this.typing.set(`${event.userName ?? 'User'} is typing`);
      }
    });
    this.socket.onStoppedTyping().pipe(takeUntil(this.destroy$)).subscribe(() => this.typing.set(null));
  }

  ngOnDestroy(): void {
    const selected = this.selectedChatId();
    if (selected) {
      this.socket.leave(selected);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectChat(chatId: string): void {
    const previous = this.selectedChatId();
    if (previous) {
      this.socket.leave(previous);
    }
    this.selectedChatId.set(chatId);
    this.socket.join(chatId);
    this.chatService.messages(chatId).subscribe((messages) => this.messages.set(messages));
    this.chatService.markChatRead(chatId).subscribe();
  }

  send(): void {
    const chatId = this.selectedChatId();
    const text = this.draft.trim();
    if (!chatId || !text) {
      return;
    }

    this.socket.sendMessage(chatId, text);
    this.chatService.send(chatId, text).subscribe((message) => {
      this.messages.update((messages) => [...messages, message]);
    });
    this.draft = '';
    this.socket.stopTyping(chatId);
  }

  notifyTyping(): void {
    const chatId = this.selectedChatId();
    if (chatId) {
      this.socket.typing(chatId);
    }
  }

  upload(event: Event): void {
    const chatId = this.selectedChatId();
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!chatId || !file) {
      return;
    }

    this.chatService.upload(chatId, file).subscribe((message) => {
      this.messages.update((messages) => [...messages, message]);
      input.value = '';
    });
  }

  private loadChats(): void {
    this.chatService.chats().subscribe((chats) => this.chats.set(chats));
  }
}
