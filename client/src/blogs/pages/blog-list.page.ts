import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Blog } from '../../core/models';
import { BlogService } from '../services/blog.service';

@Component({
  selector: 'jc-blog-list-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="jc-container space-y-6 py-8">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Blog</p>
        <h1 class="mt-1 text-3xl font-semibold">Industry insights</h1>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        @for (blog of blogs(); track blog._id) {
          <a [routerLink]="['/blogs', blog.slug || blog._id]" class="jc-panel p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-teal-700">{{ blog.category || 'Article' }}</p>
            <h2 class="mt-2 font-semibold">{{ blog.title }}</h2>
            <p class="mt-2 line-clamp-3 text-sm text-[var(--jc-muted)]">{{ blog.excerpt || '' }}</p>
          </a>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogListPageComponent implements OnInit {
  private readonly service = inject(BlogService);
  readonly blogs = signal<Blog[]>([]);

  ngOnInit(): void {
    this.service.getPublished().subscribe((blogs) => this.blogs.set(blogs));
  }
}
