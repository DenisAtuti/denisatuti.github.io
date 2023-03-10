import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { Post } from 'src/app/Models/post-model';
import { SubredditService } from 'src/app/Services/Data/subreddit.service';
import { NotifierService } from 'src/app/Services/notifier.service';
import { SetScrolledHeightService } from 'src/app/Services/set-scrolled-height.service';
import { AutoScrollService } from 'src/app/Services/auto-scroll.service';
import { Title, Meta } from '@angular/platform-browser';
import { StateService } from 'src/app/Services/State/state.service';

@Component({
  selector: 'app-subreddit',
  templateUrl: './subreddit.component.html',
  styleUrls: ['./subreddit.component.css'],
})
export class SubredditComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private subredditService: SubredditService,
    private scroll: SetScrolledHeightService,
    private renderer: Renderer2,
    private notifier: NotifierService,
    private autoScroll: AutoScrollService,
    private state: StateService,
    private title: Title,
    private meta: Meta
  ) {}

  posts: Post[] = [];
  subscription: Subscription;
  autoScrollSub: Subscription;
  isLastPage: boolean = false;
  isLoading: boolean = false;
  isContent: boolean = false;
  @Output() componentPage: string = 'subreddit';
  @ViewChild('container', { static: true }) container: ElementRef;

  ngOnInit(): void {
    this.isLoading = true;
    const subreddit = this.route.snapshot.paramMap.get('name');
    this.subredditService.determineSubredditChange(subreddit);
    this.subredditService.getPostFromServer();
    this.subredditService.isVideosLoaded();
    this.subscription = this.subredditService
      .getPosts()
      .subscribe((posts: Post[]) => {
        this.posts = posts;
        if (posts.length === 0) this.isContent = true;
        posts.forEach((post) => {
          if (post.isLast) {
            this.isLastPage = post.isLast;
          }
        });
      });
    this.title.setTitle(
      `vida videos| ${subreddit} is one of the best adult and porn categories`
    );
    this.meta.updateTag({
      name: 'description',
      content: `vida videos the world's best porn sites of ${this.state.getYeah()}. Watch free ${subreddit} porn videos, 
          sex movies and premium HD porn on the most popular porn tubes. All the top porn ...`,
    });

    this.subredditService.canGetPostFun();
    this.subredditService.unfollowLoadedAffilliate();
    this.subredditService.followLoadedAffilliate();
  }

  ngAfterViewInit() {
    this.scrollFun();
    this.autoScrollFun(this.container.nativeElement);
    this.renderer.listen(this.container.nativeElement, 'scroll', (e) => {
      this.determineLastPage(e);
      setTimeout(() => {
        this.scroll.setScrolledHeight(
          this.container.nativeElement,
          'subreddit_scrolled_height'
        );
      }, 1000);
    });
  }

  private autoScrollFun(container: any) {
    this.autoScrollSub = this.autoScroll
      .autoScroll()
      .subscribe((componentPage: string) => {
        if (componentPage === 'subreddit') {
          container.scrollBy({
            top: 100,
            behavior: 'smooth',
          });
        }
      });
  }

  determineLastPage(event) {
    const container = event.target;
    if (
      container.scrollTop >=
      container.scrollHeight - container.offsetHeight
    ) {
      if (!this.isLastPage) {
        this.notifier.showNotification({
          header: 'Warning',
          message: 'Videos are still loading',
          mode: 'warning',
        });
      }

      if (this.isLastPage) {
        this.notifier.showNotification({
          header: 'Warning',
          message: 'This is the last post',
          mode: 'warning',
        });
      }
    }
  }

  scrollFun() {
    const observable = new Observable((subscribe) => {
      setInterval(() => {
        subscribe.next(this.posts.length);
      }, 100);
    }).subscribe((response) => {
      if (response >= 1) {
        this.scroll.getScrolledHeight(
          this.container.nativeElement,
          'subreddit_scrolled_height'
        );
        observable.unsubscribe();
      }
    });
  }

  ngOnDestroy(): void {
    this.subredditService.unsubscribeCanGetPostFun();
    this.subredditService.unsubscribeIsVideosLoaded();
    this.subscription.unsubscribe();
    this.autoScrollSub.unsubscribe();
    this.subredditService.unsubscribeFolloUnfollow();
  }
}
