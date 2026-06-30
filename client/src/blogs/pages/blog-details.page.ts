import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Blog } from '../../core/models';
import { BlogService } from '../services/blog.service';

@Component({
  selector: 'jc-blog-details-page',
  standalone: true,
  template: `
    <section class="jc-container py-8">
      @if (blog(); as currentBlog) {
        <article class="jc-panel p-6">
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ currentBlog.category || 'Blog' }}</p>
          <h1 class="mt-1 text-3xl font-semibold">{{ currentBlog.title }}</h1>
          <p class="mt-3 text-sm text-[var(--jc-muted)]">{{ currentBlog.excerpt || '' }}</p>
          <div class="prose prose-slate mt-6 max-w-none dark:prose-invert">
            <p>{{ currentBlog.content || 'Article content is loading.' }}</p>
          </div>
        </article>
      } @else {
        <div class="jc-panel p-6 text-sm text-[var(--jc-muted)]">Loading blog...</div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(BlogService);
  readonly blog = signal<Blog | null>(null);

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get('blogId');
    if (!key) {
      return;
    }

    const request = /^[a-f\d]{24}$/i.test(key) ? this.service.getById(key) : this.service.getBySlug(key);
    request.subscribe((blog) => this.blog.set(blog));
  }
}
